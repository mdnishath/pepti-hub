import { PrismaClient, PaymentStatus } from '@prisma/client';
import { WalletService, ProviderService } from '@pptpay/blockchain';
import { ethers } from 'ethers';
import { Decimal } from '@prisma/client/runtime/library';

export interface SettlementParams {
  paymentId: string;
  transactionHash: string;
}

export interface SettlementResult {
  success: boolean;
  settlementTxHash?: string;
  error?: string;
  gasUsed?: string;
  merchantAmount?: string;
  platformFee?: string;
}

export class SettlementService {
  private prisma: PrismaClient;
  private walletService: WalletService;
  private providerService: ProviderService;

  // Platform wallet address (receives fees)
  private readonly PLATFORM_WALLET: string;

  // USDT token contract address
  private readonly USDT_ADDRESS: string;

  // Minimum confirmations required before settlement
  private readonly MIN_CONFIRMATIONS = 12;

  // Gas buffer multiplier for transaction fees
  private readonly GAS_BUFFER = 1.2; // 20% buffer

  constructor(
    prisma: PrismaClient,
    walletService: WalletService,
    providerService: ProviderService,
    platformWallet: string
  ) {
    this.prisma = prisma;
    this.walletService = walletService;
    this.providerService = providerService;
    // Normalize platform wallet address checksum
    this.PLATFORM_WALLET = ethers.getAddress(platformWallet);

    // Get USDT address based on network
    const network = process.env.BLOCKCHAIN_NETWORK || 'testnet';
    this.USDT_ADDRESS = network === 'mainnet'
      ? '0x55d398326f99059fF775485246999027B3197955' // BSC Mainnet USDT
      : '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'; // BSC Testnet USDT
  }

  /**
   * Process settlement for a confirmed payment
   * Transfers netAmount to merchant and feeAmount to platform
   */
  async processSettlement(paymentId: string): Promise<SettlementResult> {
    try {
      // 1. Get payment order with transaction details
      const payment = await this.prisma.paymentOrder.findUnique({
        where: { id: paymentId },
        include: {
          merchant: true,
          transactions: {
            where: { status: 'CONFIRMED' },
            orderBy: { detectedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      if (payment.status !== 'CONFIRMED') {
        return {
          success: false,
          error: `Payment status is ${payment.status}, expected CONFIRMED`
        };
      }

      if (payment.transactions.length === 0) {
        return {
          success: false,
          error: 'No confirmed transaction found'
        };
      }

      const transaction = payment.transactions[0];

      if (transaction.confirmations < this.MIN_CONFIRMATIONS) {
        return {
          success: false,
          error: `Insufficient confirmations: ${transaction.confirmations}/${this.MIN_CONFIRMATIONS}`
        };
      }

      console.log(`[SettlementService] Processing settlement for payment ${paymentId}`, {
        orderId: payment.orderId,
        amount: payment.amount.toString(),
        netAmount: payment.netAmount.toString(),
        feeAmount: payment.feeAmount.toString(),
        merchantWallet: payment.merchant.walletAddress,
        paymentAddress: payment.paymentAddress
      });

      // 2. Get the wallet for this payment address using addressIndex from database
      const addressIndex = payment.addressIndex;
      const provider = this.providerService.getProvider();
      const paymentWallet = this.walletService.getWallet(addressIndex, provider);

      // 3. Check USDT balance at payment address
      const usdtContract = new ethers.Contract(
        this.USDT_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function transfer(address to, uint256 amount) returns (bool)'
        ],
        paymentWallet
      );

      const balance = await usdtContract.balanceOf(payment.paymentAddress);
      const balanceDecimal = ethers.formatUnits(balance, 18);

      console.log(`[SettlementService] Payment address balance: ${balanceDecimal} USDT`);

      if (parseFloat(balanceDecimal) < parseFloat(payment.amount.toString())) {
        return {
          success: false,
          error: `Insufficient balance: ${balanceDecimal} USDT (expected: ${payment.amount})`
        };
      }

      // 4. Calculate amounts with gas fee deduction (USDT has 18 decimals)
      // Gas cost: ~0.001 BNB × $600 = ~$0.60 in USDT
      const GAS_COST_BNB = 0.001;
      const BNB_PRICE_USD = 600; // Can be fetched from price oracle
      const gasCostUSDT = GAS_COST_BNB * BNB_PRICE_USD; // ~0.6 USDT

      // Deduct gas cost from merchant's net amount
      const merchantNetAmount = parseFloat(payment.netAmount.toString()) - gasCostUSDT;
      const netAmountWei = ethers.parseUnits(merchantNetAmount.toFixed(4), 18);

      // Platform gets: original fee + gas cost reimbursement
      const platformFeeTotal = parseFloat(payment.feeAmount.toString()) + gasCostUSDT;
      const feeAmountWei = ethers.parseUnits(platformFeeTotal.toFixed(4), 18);

      console.log(`[SettlementService] Gas cost: ${gasCostUSDT} USDT (deducted from merchant)`);
      console.log(`[SettlementService] Merchant receives: ${merchantNetAmount.toFixed(4)} USDT`);
      console.log(`[SettlementService] Platform receives: ${platformFeeTotal.toFixed(4)} USDT (fee + gas)`)

      // 5. Check BNB balance for gas (need BNB for transaction fees)
      const bnbBalance = await provider.getBalance(payment.paymentAddress);
      const estimatedGas = ethers.parseUnits('0.001', 'ether'); // Estimate ~0.001 BNB for 2 transfers

      if (bnbBalance < estimatedGas) {
        console.warn(`[SettlementService] Insufficient BNB for gas: ${ethers.formatEther(bnbBalance)} BNB`);
        return {
          success: false,
          error: `Insufficient BNB for gas fees: ${ethers.formatEther(bnbBalance)} BNB (need ~0.001 BNB)`
        };
      }

      // 6. Execute settlements (transfer to merchant and platform)
      console.log(`[SettlementService] Transferring ${payment.netAmount} USDT to merchant: ${payment.merchant.walletAddress}`);

      // Transfer netAmount to merchant (normalize address checksum)
      const merchantAddress = ethers.getAddress(payment.merchant.walletAddress);
      const merchantTx = await usdtContract.transfer(
        merchantAddress,
        netAmountWei
      );
      const merchantReceipt = await merchantTx.wait();

      console.log(`[SettlementService] Merchant transfer successful: ${merchantReceipt.hash}`);
      console.log(`[SettlementService] Transferring ${payment.feeAmount} USDT fee to platform: ${this.PLATFORM_WALLET}`);

      // Transfer feeAmount to platform
      const platformTx = await usdtContract.transfer(
        this.PLATFORM_WALLET,
        feeAmountWei
      );
      const platformReceipt = await platformTx.wait();

      console.log(`[SettlementService] Platform fee transfer successful: ${platformReceipt.hash}`);

      // 7. Update payment status to SETTLED
      await this.prisma.paymentOrder.update({
        where: { id: paymentId },
        data: {
          status: 'SETTLED',
          settledAt: new Date()
        }
      });

      // 8. Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'SETTLEMENT_COMPLETED',
          merchantId: payment.merchantId,
          metadata: {
            paymentOrderId: paymentId,
            orderId: payment.orderId,
            merchantTxHash: merchantReceipt.hash,
            platformTxHash: platformReceipt.hash,
            merchantAmount: payment.netAmount.toString(),
            platformFee: payment.feeAmount.toString(),
            gasUsed: (merchantReceipt.gasUsed + platformReceipt.gasUsed).toString()
          }
        }
      });

      console.log(`[SettlementService] ✅ Settlement completed for payment ${paymentId}`);

      return {
        success: true,
        settlementTxHash: merchantReceipt.hash,
        gasUsed: (merchantReceipt.gasUsed + platformReceipt.gasUsed).toString(),
        merchantAmount: payment.netAmount.toString(),
        platformFee: payment.feeAmount.toString()
      };

    } catch (error: any) {
      console.error(`[SettlementService] Error processing settlement for ${paymentId}:`, error);

      // Log settlement failure
      try {
        const payment = await this.prisma.paymentOrder.findUnique({
          where: { id: paymentId },
          select: { merchantId: true, orderId: true }
        });

        if (payment) {
          await this.prisma.auditLog.create({
            data: {
              action: 'SETTLEMENT_FAILED',
              merchantId: payment.merchantId,
              metadata: {
                paymentOrderId: paymentId,
                orderId: payment.orderId,
                error: error.message,
                stack: error.stack
              }
            }
          });
        }
      } catch (logError) {
        console.error('[SettlementService] Failed to log settlement error:', logError);
      }

      return {
        success: false,
        error: error.message || 'Unknown error during settlement'
      };
    }
  }

  /**
   * Get pending settlements (confirmed but not settled)
   */
  async getPendingSettlements(): Promise<string[]> {
    const pendingPayments = await this.prisma.paymentOrder.findMany({
      where: {
        status: 'CONFIRMED',
        transactions: {
          some: {
            status: 'CONFIRMED',
            confirmations: { gte: this.MIN_CONFIRMATIONS }
          }
        }
      },
      select: { id: true }
    });

    return pendingPayments.map(p => p.id);
  }

  /**
   * Batch process all pending settlements
   */
  async processAllPendingSettlements(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ paymentId: string; result: SettlementResult }>;
  }> {
    const pendingPaymentIds = await this.getPendingSettlements();

    console.log(`[SettlementService] Processing ${pendingPaymentIds.length} pending settlements`);

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const paymentId of pendingPaymentIds) {
      const result = await this.processSettlement(paymentId);
      results.push({ paymentId, result });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add delay between settlements to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[SettlementService] Batch processing complete: ${successful} successful, ${failed} failed`);

    return {
      processed: pendingPaymentIds.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Check if a payment is eligible for settlement
   */
  async isEligibleForSettlement(paymentId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const payment = await this.prisma.paymentOrder.findUnique({
      where: { id: paymentId },
      include: {
        transactions: {
          where: { status: 'CONFIRMED' },
          orderBy: { detectedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!payment) {
      return { eligible: false, reason: 'Payment not found' };
    }

    if (payment.status === 'SETTLED') {
      return { eligible: false, reason: 'Already settled' };
    }

    if (payment.status !== 'CONFIRMED') {
      return { eligible: false, reason: `Payment status is ${payment.status}` };
    }

    if (payment.transactions.length === 0) {
      return { eligible: false, reason: 'No confirmed transaction' };
    }

    const confirmations = payment.transactions[0].confirmations;
    if (confirmations < this.MIN_CONFIRMATIONS) {
      return {
        eligible: false,
        reason: `Waiting for confirmations: ${confirmations}/${this.MIN_CONFIRMATIONS}`
      };
    }

    return { eligible: true };
  }
}
