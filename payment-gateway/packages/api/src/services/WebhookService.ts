import { PrismaClient, PaymentStatus, Currency } from '@prisma/client';
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';

export interface WebhookPayload {
  event: 'payment.created' | 'payment.pending' | 'payment.confirmed' | 'payment.settled' | 'payment.expired' | 'payment.failed';
  timestamp: string;
  data: {
    paymentId: string;
    orderId: string;
    amount: string;
    feeAmount: string;
    netAmount: string;
    currency: Currency;
    status: PaymentStatus;
    paymentAddress: string;
    txHash?: string;
    confirmations?: number;
    metadata?: any;
  };
}

export class WebhookService {
  private prisma: PrismaClient;
  private signingSecret: string;

  // Retry configuration
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAYS = [10, 30, 60, 300, 900]; // seconds: 10s, 30s, 1m, 5m, 15m

  constructor(prisma: PrismaClient, signingSecret: string) {
    this.prisma = prisma;
    this.signingSecret = signingSecret;
  }

  /**
   * Send webhook notification for a payment event
   */
  async sendWebhook(
    paymentId: string,
    event: WebhookPayload['event'],
    additionalData?: any
  ): Promise<void> {
    try {
      // Get payment order with merchant info
      const payment = await this.prisma.paymentOrder.findUnique({
        where: { id: paymentId },
        include: {
          merchant: true,
          transactions: {
            orderBy: { detectedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!payment) {
        console.error(`[WebhookService] Payment ${paymentId} not found`);
        return;
      }

      // Check if merchant has callback URL
      if (!payment.callbackUrl) {
        console.log(`[WebhookService] No callback URL for payment ${paymentId}`);
        return;
      }

      // Build webhook payload
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount.toString(),
          feeAmount: payment.feeAmount.toString(),
          netAmount: payment.netAmount.toString(),
          currency: payment.currency,
          status: payment.status,
          paymentAddress: payment.paymentAddress,
          txHash: payment.transactions[0]?.txHash,
          confirmations: payment.transactions[0]?.confirmations,
          metadata: payment.metadata,
          ...additionalData
        }
      };

      // Generate signature
      const signature = this.generateSignature(payload);

      // Create webhook delivery record
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          paymentOrderId: paymentId,
          event: event,
          url: payment.callbackUrl,
          payload: payload as any,
          signature,
          status: 'PENDING',
          attempts: 0
        }
      });

      // Send webhook
      await this.deliverWebhook(delivery.id, payment.callbackUrl, payload, signature);
    } catch (error) {
      console.error('[WebhookService] Error sending webhook:', error);
    }
  }

  /**
   * Deliver webhook to merchant's callback URL
   */
  private async deliverWebhook(
    deliveryId: string,
    url: string,
    payload: WebhookPayload,
    signature: string
  ): Promise<void> {
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
        validateStatus: (status) => status >= 200 && status < 300
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

      console.log(`[WebhookService] ✅ Webhook delivered to ${url}`, {
        deliveryId,
        event: payload.event,
        status: response.status
      });
    } catch (error) {
      await this.handleWebhookError(deliveryId, url, payload, signature, error as Error);
    }
  }

  /**
   * Handle webhook delivery error and schedule retry
   */
  private async handleWebhookError(
    deliveryId: string,
    url: string,
    payload: WebhookPayload,
    signature: string,
    error: Error
  ): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) return;

    let responseCode: number | undefined;
    let errorMessage = error.message;

    if (axios.isAxiosError(error)) {
      responseCode = error.response?.status;
      errorMessage = error.response?.data?.message || error.message;
    }

    console.error(`[WebhookService] ❌ Webhook delivery failed (attempt ${delivery.attempts}/${this.MAX_RETRIES}):`, {
      deliveryId,
      url,
      error: errorMessage,
      status: responseCode
    });

    // Check if we should retry
    if (delivery.attempts < this.MAX_RETRIES) {
      // Calculate next retry time with exponential backoff
      const nextRetryDelay = this.RETRY_DELAYS[delivery.attempts - 1] || 900; // default to 15 minutes
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

      console.log(`[WebhookService] ⏰ Retry scheduled at ${nextRetryAt.toISOString()} (in ${nextRetryDelay}s)`);
      console.log(`[WebhookService] 📋 Webhook added to retry queue (WebhookWorker will process it)`);
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

      console.error(`[WebhookService] 💀 Webhook failed permanently after ${this.MAX_RETRIES} attempts`);
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', this.signingSecret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature (for testing/debugging)
   */
  static verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Retry failed webhooks manually
   */
  async retryFailedWebhooks(): Promise<number> {
    const failedDeliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: 'FAILED',
        attempts: { lt: this.MAX_RETRIES }
      },
      include: {
        paymentOrder: true
      }
    });

    for (const delivery of failedDeliveries) {
      if (delivery.paymentOrder.callbackUrl) {
        await this.deliverWebhook(
          delivery.id,
          delivery.paymentOrder.callbackUrl,
          delivery.payload as WebhookPayload,
          delivery.signature
        );
      }
    }

    return failedDeliveries.length;
  }

  /**
   * Get webhook delivery status
   */
  async getDeliveryStatus(deliveryId: string) {
    return this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId }
    });
  }

  /**
   * Get all webhook deliveries for a payment
   */
  async getPaymentWebhooks(paymentId: string) {
    return this.prisma.webhookDelivery.findMany({
      where: { paymentOrderId: paymentId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
