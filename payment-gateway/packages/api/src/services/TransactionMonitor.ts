import { PrismaClient, Currency } from '@prisma/client';
import { ProviderService, TokenService } from '@pptpay/blockchain';
import { PaymentService } from './PaymentService';
import { SettlementService } from './SettlementService';
import { ethers } from 'ethers';

interface MonitorConfig {
  network: 'mainnet' | 'testnet';
  confirmationsRequired: number;
}

export class TransactionMonitor {
  private prisma: PrismaClient;
  private providerService: ProviderService;
  private tokenServices: Map<Currency, TokenService>;
  private paymentService: PaymentService;
  private settlementService: SettlementService;
  private config: MonitorConfig;

  private isMonitoring = false;
  private blockCheckInterval?: NodeJS.Timeout;

  constructor(
    prisma: PrismaClient,
    providerService: ProviderService,
    paymentService: PaymentService,
    settlementService: SettlementService,
    config: MonitorConfig
  ) {
    this.prisma = prisma;
    this.providerService = providerService;
    this.paymentService = paymentService;
    this.settlementService = settlementService;
    this.config = config;

    // Initialize token services for each currency
    this.tokenServices = new Map();
    const provider = providerService.getProvider();

    this.tokenServices.set(
      Currency.USDT,
      new TokenService(provider, { network: config.network })
    );
    this.tokenServices.set(
      Currency.USDC,
      new TokenService(provider, { network: config.network })
    );
    this.tokenServices.set(
      Currency.BUSD,
      new TokenService(provider, { network: config.network })
    );
  }

  /**
   * Start monitoring all active payment addresses
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.log('[TransactionMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('[TransactionMonitor] Starting transaction monitor...');

    try {
      // Get all active payments (CREATED or PENDING)
      const activePayments = await this.prisma.paymentOrder.findMany({
        where: {
          status: {
            in: ['CREATED', 'PENDING']
          }
        }
      });

      console.log(`[TransactionMonitor] Monitoring ${activePayments.length} active payments`);

      // Set up event listeners for each payment address
      for (const payment of activePayments) {
        this.monitorPaymentAddress(payment.paymentAddress, payment.currency);
      }
    } catch (error) {
      console.log('[TransactionMonitor] No existing payments to monitor (database may be initializing)');
    }

    // Start periodic confirmation checking (every 15 seconds)
    this.blockCheckInterval = setInterval(() => {
      this.checkPendingConfirmations();
    }, 15000);

    console.log('[TransactionMonitor] ✅ Monitor started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Clear interval
    if (this.blockCheckInterval) {
      clearInterval(this.blockCheckInterval);
      this.blockCheckInterval = undefined;
    }

    // Remove all event listeners
    for (const tokenService of this.tokenServices.values()) {
      tokenService.removeAllListeners();
    }

    console.log('[TransactionMonitor] ⏸️  Monitor stopped');
  }

  /**
   * Monitor a specific payment address for incoming transfers
   */
  private monitorPaymentAddress(address: string, currency: Currency): void {
    const tokenService = this.tokenServices.get(currency);
    if (!tokenService) {
      console.error(`[TransactionMonitor] No token service for ${currency}`);
      return;
    }

    console.log(`[TransactionMonitor] 👀 Watching ${address} for ${currency}`);

    // Listen for incoming transfers to this address
    tokenService.monitorTransfers(
      address,
      currency,
      async (from: string, to: string, amount: string, txHash: string) => {
        console.log(`[TransactionMonitor] 💰 Detected transfer:`, {
          from,
          to,
          amount,
          currency,
          txHash
        });

        await this.handleIncomingTransaction(to, amount, currency, txHash, from);
      }
    );
  }

  /**
   * Handle an incoming transaction
   */
  private async handleIncomingTransaction(
    toAddress: string,
    amount: string,
    currency: Currency,
    txHash: string,
    fromAddress: string
  ): Promise<void> {
    try {
      // Find payment order for this address
      const payment = await this.paymentService.getPaymentByAddress(toAddress);

      if (!payment) {
        console.warn(`[TransactionMonitor] No payment found for address ${toAddress}`);
        return;
      }

      // Check if payment is still valid
      if (payment.status === 'EXPIRED') {
        console.warn(`[TransactionMonitor] Payment ${payment.id} already expired`);
        return;
      }

      if (payment.status === 'CONFIRMED' || payment.status === 'SETTLED') {
        console.warn(`[TransactionMonitor] Payment ${payment.id} already ${payment.status}`);
        return;
      }

      // Check if amount matches
      const receivedAmount = parseFloat(amount);
      const expectedAmount = parseFloat(payment.amount);

      if (receivedAmount < expectedAmount) {
        console.warn(`[TransactionMonitor] Insufficient amount:`, {
          received: receivedAmount,
          expected: expectedAmount,
          paymentId: payment.id
        });
        // TODO: Handle partial payments
        return;
      }

      // Get transaction receipt to get block number
      const provider = this.providerService.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        console.warn(`[TransactionMonitor] No receipt found for ${txHash}`);
        return;
      }

      // Record transaction
      await this.paymentService.recordTransaction({
        paymentOrderId: payment.id,
        txHash,
        fromAddress,
        toAddress,
        amount,
        currency,
        blockNumber: receipt.blockNumber
      });

      console.log(`[TransactionMonitor] ✅ Transaction recorded for payment ${payment.id}`);
    } catch (error) {
      console.error('[TransactionMonitor] Error handling transaction:', error);
    }
  }

  /**
   * Check pending transactions for confirmations
   */
  private async checkPendingConfirmations(): Promise<void> {
    try {
      // Get all pending transactions
      const pendingTxs = await this.prisma.transaction.findMany({
        where: {
          status: 'PENDING'
        },
        include: {
          paymentOrder: true
        }
      });

      if (pendingTxs.length === 0) return;

      // Get current block number
      const currentBlock = await this.providerService.getBlockNumber();

      for (const tx of pendingTxs) {
        // Convert BigInt to Number for arithmetic
        const txBlockNumber = Number(tx.blockNumber);
        const confirmations = currentBlock - txBlockNumber;

        // Update confirmations
        await this.paymentService.updateTransactionConfirmations(
          tx.txHash,
          confirmations,
          currentBlock
        );

        if (confirmations >= this.config.confirmationsRequired) {
          console.log(`[TransactionMonitor] ✅ Transaction ${tx.txHash} reached ${confirmations} confirmations`);

          // Trigger automatic settlement if payment is CONFIRMED and not yet SETTLED
          if (tx.paymentOrder.status === 'CONFIRMED') {
            console.log(`[TransactionMonitor] 🔄 Initiating automatic settlement for payment ${tx.paymentOrderId}`);

            try {
              const settlementResult = await this.settlementService.processSettlement(tx.paymentOrderId);

              if (settlementResult.success) {
                console.log(`[TransactionMonitor] ✅ Settlement successful:`, {
                  paymentId: tx.paymentOrderId,
                  txHash: settlementResult.settlementTxHash,
                  merchantAmount: settlementResult.merchantAmount,
                  platformFee: settlementResult.platformFee
                });
              } else {
                console.error(`[TransactionMonitor] ❌ Settlement failed:`, {
                  paymentId: tx.paymentOrderId,
                  error: settlementResult.error
                });
              }
            } catch (settlementError) {
              console.error(`[TransactionMonitor] Error during settlement:`, settlementError);
            }
          }
        }
      }
    } catch (error) {
      console.error('[TransactionMonitor] Error checking confirmations:', error);
    }
  }

  /**
   * Add monitoring for a new payment address
   */
  async addPaymentToMonitor(paymentAddress: string, currency: Currency): Promise<void> {
    if (!this.isMonitoring) {
      console.warn('[TransactionMonitor] Monitor not started yet');
      return;
    }

    this.monitorPaymentAddress(paymentAddress, currency);
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isMonitoring: boolean; activeListeners: number } {
    let activeListeners = 0;
    for (const tokenService of this.tokenServices.values()) {
      // Each token service has listeners for different addresses
      activeListeners += 1; // Simplified - in production, track actual listener count
    }

    return {
      isMonitoring: this.isMonitoring,
      activeListeners
    };
  }
}
