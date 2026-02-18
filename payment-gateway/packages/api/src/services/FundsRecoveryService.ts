import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { WalletService } from '@pptpay/blockchain';
import { ProviderService } from '@pptpay/blockchain';

export class FundsRecoveryService {
  private prisma: PrismaClient;
  private walletService: WalletService;
  private providerService: ProviderService;
  private platformWallet: ethers.HDNodeWallet;

  // USDT contract
  private readonly USDT_ADDRESS: string;

  constructor(
    prisma: PrismaClient,
    walletService: WalletService,
    providerService: ProviderService
  ) {
    this.prisma = prisma;
    this.walletService = walletService;
    this.providerService = providerService;

    const provider = this.providerService.getProvider();
    this.platformWallet = this.walletService.getWallet(0, provider);

    // Get USDT address based on network
    const network = process.env.BLOCKCHAIN_NETWORK || 'testnet';
    this.USDT_ADDRESS = network === 'mainnet'
      ? '0x55d398326f99059fF775485246999027B3197955'  // BSC Mainnet USDT
      : '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'; // BSC Testnet USDT

    console.log('[FundsRecoveryService] Initialized');
    console.log('[FundsRecoveryService] Platform wallet:', this.platformWallet.address);
    console.log('[FundsRecoveryService] USDT address:', this.USDT_ADDRESS);
  }

  /**
   * Get all unsettled payments with funds
   */
  async getUnsettledPayments(): Promise<any[]> {
    const payments = await this.prisma.paymentOrder.findMany({
      where: {
        status: {
          in: ['CREATED', 'PENDING', 'CONFIRMED']
        },
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        }
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check balance for each
    const provider = this.providerService.getProvider();
    const usdtContract = new ethers.Contract(
      this.USDT_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );

    const paymentsWithBalance = [];

    for (const payment of payments) {
      try {
        const usdtBalance = await usdtContract.balanceOf(payment.paymentAddress);
        const bnbBalance = await provider.getBalance(payment.paymentAddress);

        if (usdtBalance > 0n || bnbBalance > ethers.parseEther('0.0001')) {
          paymentsWithBalance.push({
            id: payment.id,
            orderId: payment.orderId,
            amount: payment.amount.toString(),
            paymentAddress: payment.paymentAddress,
            addressIndex: payment.addressIndex,
            status: payment.status,
            createdAt: payment.createdAt,
            merchant: payment.merchant,
            balances: {
              usdt: ethers.formatUnits(usdtBalance, 18),
              bnb: ethers.formatEther(bnbBalance)
            }
          });
        }
      } catch (error: any) {
        console.error(`[FundsRecovery] Error checking ${payment.paymentAddress}:`, error.message);
      }
    }

    return paymentsWithBalance;
  }

  /**
   * Recover funds from a specific payment address
   */
  async recoverFromAddress(paymentId: string): Promise<{
    success: boolean;
    usdtRecovered?: string;
    bnbRecovered?: string;
    txHashes?: string[];
    error?: string;
  }> {
    try {
      const payment = await this.prisma.paymentOrder.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      const provider = this.providerService.getProvider();
      const paymentWallet = this.walletService.getWallet(payment.addressIndex, provider);

      console.log(`[FundsRecovery] Recovering from: ${paymentWallet.address} (index: ${payment.addressIndex})`);

      // Check balances
      const usdtContract = new ethers.Contract(
        this.USDT_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function transfer(address to, uint256 amount) returns (bool)'
        ],
        paymentWallet
      );

      const usdtBalance = await usdtContract.balanceOf(paymentWallet.address);
      const bnbBalance = await provider.getBalance(paymentWallet.address);

      console.log(`[FundsRecovery] USDT balance: ${ethers.formatUnits(usdtBalance, 18)}`);
      console.log(`[FundsRecovery] BNB balance: ${ethers.formatEther(bnbBalance)}`);

      const txHashes: string[] = [];
      let usdtRecovered = '0';
      let bnbRecovered = '0';

      // Recover USDT if any
      if (usdtBalance > 0n) {
        console.log('[FundsRecovery] Transferring USDT to platform wallet...');
        const usdtTx = await usdtContract.transfer(
          this.platformWallet.address,
          usdtBalance
        );
        const usdtReceipt = await usdtTx.wait();
        txHashes.push(usdtReceipt.hash);
        usdtRecovered = ethers.formatUnits(usdtBalance, 18);
        console.log(`[FundsRecovery] ✅ USDT recovered: ${usdtRecovered}`);
      }

      // Recover BNB if any (after USDT to have gas for USDT transfer)
      if (bnbBalance > ethers.parseEther('0.0001')) {
        // Estimate gas for BNB transfer
        const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('3', 'gwei');
        const gasCost = gasPrice * 21000n;
        const bnbToRecover = bnbBalance - gasCost;

        if (bnbToRecover > 0n) {
          console.log('[FundsRecovery] Transferring BNB to platform wallet...');
          const bnbTx = await paymentWallet.sendTransaction({
            to: this.platformWallet.address,
            value: bnbToRecover,
            gasPrice: gasPrice
          });
          const bnbReceipt = await bnbTx.wait();
          txHashes.push(bnbReceipt.hash);
          bnbRecovered = ethers.formatEther(bnbToRecover);
          console.log(`[FundsRecovery] ✅ BNB recovered: ${bnbRecovered}`);
        }
      }

      console.log(`[FundsRecovery] ✅ Recovery complete for payment ${paymentId}`);

      return {
        success: true,
        usdtRecovered,
        bnbRecovered,
        txHashes
      };
    } catch (error: any) {
      console.error('[FundsRecovery] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recover funds from all unsettled payments
   */
  async recoverAll(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    totalUSDT: string;
    totalBNB: string;
    results: any[];
  }> {
    const unsettledPayments = await this.getUnsettledPayments();

    console.log(`[FundsRecovery] Found ${unsettledPayments.length} unsettled payments with funds`);

    const results = [];
    let successful = 0;
    let failed = 0;
    let totalUSDT = 0;
    let totalBNB = 0;

    for (const payment of unsettledPayments) {
      console.log(`[FundsRecovery] Processing payment ${payment.orderId}...`);

      const result = await this.recoverFromAddress(payment.id);

      if (result.success) {
        successful++;
        totalUSDT += parseFloat(result.usdtRecovered || '0');
        totalBNB += parseFloat(result.bnbRecovered || '0');
      } else {
        failed++;
      }

      results.push({
        paymentId: payment.id,
        orderId: payment.orderId,
        paymentAddress: payment.paymentAddress,
        result
      });

      // Wait 2 seconds between recoveries to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[FundsRecovery] ✅ Recovery complete!`);
    console.log(`[FundsRecovery] Processed: ${unsettledPayments.length}`);
    console.log(`[FundsRecovery] Successful: ${successful}`);
    console.log(`[FundsRecovery] Failed: ${failed}`);
    console.log(`[FundsRecovery] Total USDT recovered: ${totalUSDT.toFixed(4)}`);
    console.log(`[FundsRecovery] Total BNB recovered: ${totalBNB.toFixed(4)}`);

    return {
      processed: unsettledPayments.length,
      successful,
      failed,
      totalUSDT: totalUSDT.toFixed(4),
      totalBNB: totalBNB.toFixed(4),
      results
    };
  }

  /**
   * Get summary of recoverable funds
   */
  async getRecoverySummary(): Promise<{
    count: number;
    totalUSDT: string;
    totalBNB: string;
    estimatedValueUSD: string;
  }> {
    const unsettledPayments = await this.getUnsettledPayments();

    let totalUSDT = 0;
    let totalBNB = 0;

    for (const payment of unsettledPayments) {
      totalUSDT += parseFloat(payment.balances.usdt);
      totalBNB += parseFloat(payment.balances.bnb);
    }

    // Estimate USD value (BNB @ $600)
    const estimatedValueUSD = totalUSDT + (totalBNB * 600);

    return {
      count: unsettledPayments.length,
      totalUSDT: totalUSDT.toFixed(4),
      totalBNB: totalBNB.toFixed(4),
      estimatedValueUSD: estimatedValueUSD.toFixed(2)
    };
  }
}
