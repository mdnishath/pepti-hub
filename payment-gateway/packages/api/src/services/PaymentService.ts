import { PrismaClient, PaymentStatus, Currency } from '@prisma/client';
import { WalletService } from '@pptpay/blockchain';
import { Decimal } from '@prisma/client/runtime/library';
import { QRCodeService } from './QRCodeService';

export interface CreatePaymentParams {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: Currency;
  callbackUrl?: string;
  returnUrl?: string;
  metadata?: any;
}

export interface PaymentOrderResponse {
  id: string;
  orderId: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  currency: Currency;
  paymentAddress: string;
  status: PaymentStatus;
  expiresAt: Date;
  qrCode?: string;
}

export class PaymentService {
  private prisma: PrismaClient;
  private walletService: WalletService;
  private qrCodeService: QRCodeService;

  // Platform fee: 2.5%
  private readonly PLATFORM_FEE_PERCENT = 2.5;

  // Payment expiration: 15 minutes
  private readonly PAYMENT_EXPIRATION_MINUTES = 15;

  // USDT token addresses
  private readonly USDT_ADDRESSES = {
    mainnet: '0x55d398326f99059fF775485246999027B3197955', // BSC Mainnet
    testnet: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'  // BSC Testnet
  };

  constructor(prisma: PrismaClient, walletService: WalletService) {
    this.prisma = prisma;
    this.walletService = walletService;
    this.qrCodeService = new QRCodeService();
  }

  /**
   * Create a new payment order
   * Automatically calculates 2.5% platform fee
   * Generates unique payment address
   * Sets 15-minute expiration
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentOrderResponse> {
    // 1. Calculate fees
    const amount = new Decimal(params.amount);
    const feeAmount = amount.mul(this.PLATFORM_FEE_PERCENT).div(100);
    const netAmount = amount.sub(feeAmount);

    // 2. Get next available address index
    const lastPayment = await this.prisma.paymentOrder.findFirst({
      orderBy: { addressIndex: 'desc' },
      select: { addressIndex: true }
    });
    const addressIndex = (lastPayment?.addressIndex ?? -1) + 1;

    // 3. Generate unique payment address
    const paymentAddress = this.walletService.derivePaymentAddress(addressIndex);

    // 4. Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.PAYMENT_EXPIRATION_MINUTES);

    // 5. Create payment order in database
    const paymentOrder = await this.prisma.paymentOrder.create({
      data: {
        merchantId: params.merchantId,
        orderId: params.orderId,
        amount,
        feeAmount,
        netAmount,
        currency: params.currency,
        paymentAddress,
        addressIndex,
        status: PaymentStatus.CREATED,
        expiresAt,
        callbackUrl: params.callbackUrl,
        returnUrl: params.returnUrl,
        metadata: params.metadata || {}
      }
    });

    // 6. Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_CREATED',
        merchantId: params.merchantId,
        metadata: {
          paymentOrderId: paymentOrder.id,
          orderId: params.orderId,
          amount: params.amount,
          currency: params.currency,
          addressIndex
        }
      }
    });

    console.log(`[PaymentService] Created payment order ${paymentOrder.id}`, {
      orderId: params.orderId,
      amount: amount.toString(),
      fee: feeAmount.toString(),
      net: netAmount.toString(),
      address: paymentAddress,
      expiresAt
    });

    // Generate QR code for the payment address
    let qrCode: string | undefined;
    try {
      qrCode = await this.qrCodeService.generateAddressQRCode(paymentAddress, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('[PaymentService] Failed to generate QR code:', error);
      // Don't fail the payment creation if QR code generation fails
    }

    return {
      id: paymentOrder.id,
      orderId: paymentOrder.orderId,
      amount: amount.toString(),
      feeAmount: feeAmount.toString(),
      netAmount: netAmount.toString(),
      currency: paymentOrder.currency,
      paymentAddress: paymentOrder.paymentAddress,
      status: paymentOrder.status,
      expiresAt: paymentOrder.expiresAt,
      qrCode
    };
  }

  /**
   * Get payment order by ID
   */
  async getPayment(paymentId: string): Promise<PaymentOrderResponse | null> {
    const payment = await this.prisma.paymentOrder.findUnique({
      where: { id: paymentId }
    });

    if (!payment) return null;

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toString(),
      feeAmount: payment.feeAmount.toString(),
      netAmount: payment.netAmount.toString(),
      currency: payment.currency,
      paymentAddress: payment.paymentAddress,
      status: payment.status,
      expiresAt: payment.expiresAt
    };
  }

  /**
   * Get payment order by payment address
   */
  async getPaymentByAddress(address: string): Promise<PaymentOrderResponse | null> {
    const payment = await this.prisma.paymentOrder.findUnique({
      where: { paymentAddress: address }
    });

    if (!payment) return null;

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toString(),
      feeAmount: payment.feeAmount.toString(),
      netAmount: payment.netAmount.toString(),
      currency: payment.currency,
      paymentAddress: payment.paymentAddress,
      status: payment.status,
      expiresAt: payment.expiresAt
    };
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    details?: any
  ): Promise<void> {
    await this.prisma.paymentOrder.update({
      where: { id: paymentId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Log status change
    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_STATUS_CHANGED',
        merchantId: (await this.prisma.paymentOrder.findUnique({ where: { id: paymentId }, select: { merchantId: true } }))!.merchantId,
        metadata: {
          paymentOrderId: paymentId,
          newStatus: status,
          ...details
        }
      }
    });

    console.log(`[PaymentService] Payment ${paymentId} status: ${status}`);
  }

  /**
   * Expire old payments
   * Should be run periodically (e.g., every minute)
   */
  async expireOldPayments(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.paymentOrder.updateMany({
      where: {
        expiresAt: { lt: now },
        status: {
          in: [PaymentStatus.CREATED, PaymentStatus.PENDING]
        }
      },
      data: {
        status: PaymentStatus.EXPIRED,
        updatedAt: now
      }
    });

    if (result.count > 0) {
      console.log(`[PaymentService] Expired ${result.count} payments`);
    }

    return result.count;
  }

  /**
   * Record a transaction for a payment
   */
  async recordTransaction(params: {
    paymentOrderId: string;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    currency: Currency;
    blockNumber: number;
  }): Promise<void> {
    // Check if transaction already exists
    const existing = await this.prisma.transaction.findUnique({
      where: { txHash: params.txHash }
    });

    if (existing) {
      console.log(`[PaymentService] Transaction ${params.txHash} already recorded`);
      return;
    }

    // Get token contract address based on currency and network
    const getTokenAddress = (currency: Currency): string => {
      const network = process.env.BLOCKCHAIN_NETWORK || 'testnet';
      const tokenAddresses: Record<string, Record<Currency, string>> = {
        mainnet: {
          USDT: '0x55d398326f99059fF775485246999027B3197955',
          USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
        },
        testnet: {
          USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
          USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
          BUSD: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee'
        }
      };
      return tokenAddresses[network][currency];
    };

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        paymentOrderId: params.paymentOrderId,
        txHash: params.txHash,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        amount: new Decimal(params.amount),
        tokenAddress: getTokenAddress(params.currency),
        blockNumber: params.blockNumber,
        confirmations: 0,
        status: 'PENDING'
      }
    });

    // Update payment status to PENDING
    await this.updatePaymentStatus(params.paymentOrderId, PaymentStatus.PENDING, {
      txHash: params.txHash,
      blockNumber: params.blockNumber
    });

    console.log(`[PaymentService] Recorded transaction ${params.txHash}`, {
      paymentOrderId: params.paymentOrderId,
      amount: params.amount,
      blockNumber: params.blockNumber
    });
  }

  /**
   * Update transaction confirmations
   */
  async updateTransactionConfirmations(
    txHash: string,
    confirmations: number,
    currentBlockNumber: number
  ): Promise<void> {
    const tx = await this.prisma.transaction.findUnique({
      where: { txHash },
      include: { paymentOrder: true }
    });

    if (!tx) return;

    // Update transaction
    await this.prisma.transaction.update({
      where: { txHash },
      data: { confirmations }
    });

    // If reached 12 confirmations, mark as CONFIRMED
    if (confirmations >= 12 && tx.status !== 'CONFIRMED') {
      await this.prisma.transaction.update({
        where: { txHash },
        data: { status: 'CONFIRMED' }
      });

      // Update payment status to CONFIRMED
      await this.updatePaymentStatus(tx.paymentOrderId, PaymentStatus.CONFIRMED, {
        confirmations,
        confirmedAt: new Date()
      });

      console.log(`[PaymentService] Transaction ${txHash} CONFIRMED (${confirmations} blocks)`);
    }
  }
}
