import { Router, Request, Response } from 'express';
import { PrismaClient, Currency } from '@prisma/client';
import { WalletService, ProviderService } from '@pptpay/blockchain';
import { PaymentService } from '../services/PaymentService';
import { TransactionMonitor } from '../services/TransactionMonitor';
import { WebhookService } from '../services/WebhookService';
import { AuthService } from '../services/AuthService';
import { apiKeyAuth } from '../middleware/auth';

// Initialize services (will be passed in from main server)
let paymentService: PaymentService;
let transactionMonitor: TransactionMonitor;
let webhookService: WebhookService;
let authService: AuthService;

export function initializePaymentRoutes(
  prisma: PrismaClient,
  walletService: WalletService,
  providerService: ProviderService,
  jwtSecret: string,
  externalTransactionMonitor: TransactionMonitor
): Router {
  // Initialize auth service
  authService = new AuthService(prisma, jwtSecret);
  // Initialize services
  paymentService = new PaymentService(prisma, walletService);

  const router = Router();

  webhookService = new WebhookService(
    prisma,
    process.env.WEBHOOK_SIGNING_SECRET || 'default-secret'
  );

  // Use the transaction monitor passed from main server (already initialized with settlement service)
  transactionMonitor = externalTransactionMonitor;

  console.log('[PaymentRoutes] ✅ Payment services initialized');

  /**
   * POST /api/v1/payments
   * Create a new payment order (requires API key authentication)
   */
  router.post('/', apiKeyAuth(authService), async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      amount,
      currency,
      callbackUrl,
      returnUrl,
      metadata
    } = req.body;

    // Get merchantId from authenticated request (set by apiKeyAuth middleware)
    const merchantId = req.merchantId!;

    // Validate required fields
    if (!orderId || !amount || !currency) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: orderId, amount, currency'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid amount: must be a positive number'
      });
    }

    // Validate currency
    if (!Object.values(Currency).includes(currency)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid currency: must be one of ${Object.values(Currency).join(', ')}`
      });
    }

    // Create payment
    const payment = await paymentService.createPayment({
      merchantId,
      orderId,
      amount,
      currency,
      callbackUrl,
      returnUrl,
      metadata
    });

    // Add to monitor
    await transactionMonitor.addPaymentToMonitor(payment.paymentAddress, payment.currency);

    // Send webhook for payment.created event
    await webhookService.sendWebhook(payment.id, 'payment.created');

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    console.error('[PaymentRoutes] Error creating payment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/payments/:paymentId
 * Get payment order by ID
 */
  router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.getPayment(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payment order not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    console.error('[PaymentRoutes] Error getting payment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/payments/:paymentId/webhooks
 * Get webhook delivery history for a payment
 */
  router.get('/:paymentId/webhooks', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const webhooks = await webhookService.getPaymentWebhooks(paymentId);

    res.json({
      success: true,
      data: webhooks
    });
  } catch (error: any) {
    console.error('[PaymentRoutes] Error getting webhooks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/monitor/status
 * Get transaction monitor status
 */
  router.get('/monitor/status', async (req: Request, res: Response) => {
  try {
    const status = transactionMonitor.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('[PaymentRoutes] Error getting monitor status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

  return router;
}
