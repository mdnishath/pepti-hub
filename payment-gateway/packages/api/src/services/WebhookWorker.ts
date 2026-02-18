import { PrismaClient } from '@prisma/client';
import { WebhookService, WebhookPayload } from './WebhookService';

/**
 * WebhookWorker - Background worker for processing webhook delivery queue
 *
 * Features:
 * - Processes pending webhook deliveries
 * - Retries failed deliveries with exponential backoff
 * - Survives server restarts (uses database queue)
 * - Configurable check intervals
 */
export class WebhookWorker {
  private prisma: PrismaClient;
  private webhookService: WebhookService;
  private isRunning = false;
  private checkInterval?: NodeJS.Timeout;
  private readonly CHECK_INTERVAL_MS: number;

  constructor(
    prisma: PrismaClient,
    webhookService: WebhookService,
    checkIntervalSeconds: number = 30
  ) {
    this.prisma = prisma;
    this.webhookService = webhookService;
    this.CHECK_INTERVAL_MS = checkIntervalSeconds * 1000;
  }

  /**
   * Start the webhook worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[WebhookWorker] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[WebhookWorker] Starting webhook delivery worker...');

    // Process any pending webhooks immediately
    await this.processQueue();

    // Set up periodic queue checking
    this.checkInterval = setInterval(async () => {
      await this.processQueue();
    }, this.CHECK_INTERVAL_MS);

    console.log(`[WebhookWorker] ✅ Worker started (checking every ${this.CHECK_INTERVAL_MS / 1000}s)`);
  }

  /**
   * Stop the webhook worker
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    console.log('[WebhookWorker] ⏸️  Worker stopped');
  }

  /**
   * Process the webhook delivery queue
   */
  private async processQueue(): Promise<void> {
    try {
      // Find webhooks that are ready to be retried
      const pendingDeliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { nextRetryAt: null }, // Never attempted
            { nextRetryAt: { lte: new Date() } } // Retry time has passed
          ]
        },
        include: {
          paymentOrder: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 10 // Process max 10 at a time to avoid overload
      });

      if (pendingDeliveries.length === 0) {
        return; // Nothing to process
      }

      console.log(`[WebhookWorker] Processing ${pendingDeliveries.length} pending webhook deliveries`);

      // Process each delivery
      for (const delivery of pendingDeliveries) {
        try {
          await this.processDelivery(delivery);
        } catch (error) {
          console.error(`[WebhookWorker] Error processing delivery ${delivery.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[WebhookWorker] Error processing queue:', error);
    }
  }

  /**
   * Process a single webhook delivery
   */
  private async processDelivery(delivery: any): Promise<void> {
    const { id, paymentOrder, payload, signature } = delivery;

    if (!paymentOrder?.callbackUrl) {
      console.warn(`[WebhookWorker] No callback URL for delivery ${id}`);
      await this.prisma.webhookDelivery.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: 'No callback URL configured'
        }
      });
      return;
    }

    console.log(`[WebhookWorker] 📤 Delivering webhook ${id} (attempt ${delivery.attempts + 1})`);

    // The WebhookService.deliverWebhook will handle the actual delivery,
    // error handling, and scheduling retries
    await this.deliverWebhook(
      id,
      paymentOrder.callbackUrl,
      payload as WebhookPayload,
      signature
    );
  }

  /**
   * Deliver webhook using the WebhookService's private method logic
   * (duplicated here to avoid accessing private methods)
   */
  private async deliverWebhook(
    deliveryId: string,
    url: string,
    payload: WebhookPayload,
    signature: string
  ): Promise<void> {
    const axios = require('axios');
    const MAX_RETRIES = 5;
    const RETRY_DELAYS = [10, 30, 60, 300, 900]; // seconds

    try {
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId }
      });

      if (!delivery) return;

      // Update attempts
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date()
        }
      });

      // Send HTTP POST request
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-PeptiPay-Signature': signature,
          'X-PeptiPay-Event': payload.event,
          'User-Agent': 'PeptiPay-Webhook/1.0'
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status: number) => status >= 200 && status < 300
      });

      // Success!
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          responseCode: response.status,
          responseBody: response.data,
          deliveredAt: new Date()
        }
      });

      console.log(`[WebhookWorker] ✅ Webhook delivered to ${url}`, {
        deliveryId,
        event: payload.event,
        status: response.status
      });
    } catch (error: any) {
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId }
      });

      if (!delivery) return;

      let responseCode: number | undefined;
      let errorMessage = error.message;

      if (axios.isAxiosError && axios.isAxiosError(error)) {
        responseCode = error.response?.status;
        errorMessage = error.response?.data?.message || error.message;
      }

      console.error(`[WebhookWorker] ❌ Webhook delivery failed (attempt ${delivery.attempts}/${MAX_RETRIES}):`, {
        deliveryId,
        url,
        error: errorMessage,
        status: responseCode
      });

      // Check if we should retry
      if (delivery.attempts < MAX_RETRIES) {
        // Calculate next retry time with exponential backoff
        const nextRetryDelay = RETRY_DELAYS[delivery.attempts - 1] || 900; // default to 15 minutes
        const nextRetryAt = new Date();
        nextRetryAt.setSeconds(nextRetryAt.getSeconds() + nextRetryDelay);

        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'PENDING',
            responseCode,
            errorMessage,
            nextRetryAt
          }
        });

        console.log(`[WebhookWorker] ⏰ Retry scheduled at ${nextRetryAt.toISOString()} (in ${nextRetryDelay}s)`);
      } else {
        // Max retries reached
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'FAILED',
            responseCode,
            errorMessage
          }
        });

        console.error(`[WebhookWorker] 💀 Webhook failed permanently after ${MAX_RETRIES} attempts`);
      }
    }
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean;
    checkIntervalMs: number;
  } {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.CHECK_INTERVAL_MS
    };
  }

  /**
   * Manually trigger queue processing (useful for testing)
   */
  async triggerProcessing(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[WebhookWorker] Worker not running');
      return;
    }

    console.log('[WebhookWorker] Manually triggered queue processing');
    await this.processQueue();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    delivered: number;
    failed: number;
    readyForRetry: number;
  }> {
    const [pending, delivered, failed, readyForRetry] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: { status: 'PENDING' }
      }),
      this.prisma.webhookDelivery.count({
        where: { status: 'DELIVERED' }
      }),
      this.prisma.webhookDelivery.count({
        where: { status: 'FAILED' }
      }),
      this.prisma.webhookDelivery.count({
        where: {
          status: 'PENDING',
          nextRetryAt: { lte: new Date() }
        }
      })
    ]);

    return {
      pending,
      delivered,
      failed,
      readyForRetry
    };
  }
}
