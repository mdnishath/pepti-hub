import { ethers } from 'ethers';
import { WalletService } from '@pptpay/blockchain';
import { ProviderService } from '@pptpay/blockchain';

export class GasFundingService {
  private walletService: WalletService;
  private providerService: ProviderService;
  private gasFundingWallet: ethers.HDNodeWallet;

  // Gas funding configuration
  private readonly MIN_GAS_BALANCE = ethers.parseEther('0.0008'); // Minimum BNB needed
  private readonly GAS_FUNDING_AMOUNT = ethers.parseEther('0.0015'); // Amount to send (covers 1-2 settlements)
  private readonly DUST_THRESHOLD = ethers.parseEther('0.0001'); // Ignore very small amounts

  constructor(
    walletService: WalletService,
    providerService: ProviderService
  ) {
    this.walletService = walletService;
    this.providerService = providerService;

    // Gas funding wallet is the base wallet (index 0)
    // This is also the platform wallet that receives fees
    const provider = this.providerService.getProvider();
    this.gasFundingWallet = this.walletService.getWallet(0, provider);

    console.log('[GasFundingService] Initialized');
    console.log('[GasFundingService] Gas funding wallet:', this.gasFundingWallet.address);
  }

  /**
   * Check if an address needs gas funding
   */
  async needsGasFunding(address: string): Promise<boolean> {
    try {
      const provider = this.providerService.getProvider();
      const balance = await provider.getBalance(address);

      console.log(`[GasFundingService] Checking ${address}`);
      console.log(`[GasFundingService] Current BNB balance: ${ethers.formatEther(balance)} BNB`);

      return balance < this.MIN_GAS_BALANCE;
    } catch (error: any) {
      console.error(`[GasFundingService] Error checking balance:`, error.message);
      return false;
    }
  }

  /**
   * Fund an address with BNB for gas
   */
  async fundAddress(
    address: string,
    customAmount?: bigint
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Check if address needs funding
      const needsFunding = await this.needsGasFunding(address);
      if (!needsFunding) {
        console.log(`[GasFundingService] Address ${address} already has sufficient gas`);
        return {
          success: false,
          error: 'Address already has sufficient gas'
        };
      }

      // Check gas funding wallet balance
      const provider = this.providerService.getProvider();
      const fundingWalletBalance = await provider.getBalance(this.gasFundingWallet.address);

      console.log(`[GasFundingService] Gas funding wallet balance: ${ethers.formatEther(fundingWalletBalance)} BNB`);

      const amountToSend = customAmount || this.GAS_FUNDING_AMOUNT;

      if (fundingWalletBalance < amountToSend) {
        console.error(`[GasFundingService] Insufficient balance in gas funding wallet`);
        return {
          success: false,
          error: `Insufficient balance in gas funding wallet. Has: ${ethers.formatEther(fundingWalletBalance)} BNB, Need: ${ethers.formatEther(amountToSend)} BNB`
        };
      }

      // Send BNB
      console.log(`[GasFundingService] Sending ${ethers.formatEther(amountToSend)} BNB to ${address}`);

      const tx = await this.gasFundingWallet.sendTransaction({
        to: address,
        value: amountToSend
      });

      console.log(`[GasFundingService] Transaction sent: ${tx.hash}`);
      console.log(`[GasFundingService] Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`[GasFundingService] ✅ Gas funding successful!`);
      console.log(`[GasFundingService] TxHash: ${receipt?.hash}`);
      console.log(`[GasFundingService] Gas used: ${receipt?.gasUsed.toString()}`);

      return {
        success: true,
        txHash: receipt?.hash
      };
    } catch (error: any) {
      console.error(`[GasFundingService] Error funding address:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recover leftover gas from a settled payment address
   */
  async recoverGas(
    addressIndex: number
  ): Promise<{ success: boolean; recovered?: string; txHash?: string; error?: string }> {
    try {
      const provider = this.providerService.getProvider();
      const paymentWallet = this.walletService.getWallet(addressIndex, provider);

      console.log(`[GasFundingService] Checking gas recovery for address: ${paymentWallet.address}`);

      // Check balance
      const balance = await provider.getBalance(paymentWallet.address);
      console.log(`[GasFundingService] Current balance: ${ethers.formatEther(balance)} BNB`);

      // Skip if below dust threshold
      if (balance < this.DUST_THRESHOLD) {
        console.log(`[GasFundingService] Balance below dust threshold, skipping recovery`);
        return {
          success: false,
          error: 'Balance below dust threshold'
        };
      }

      // Estimate gas cost for the recovery transaction
      const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('3', 'gwei');
      const estimatedGasCost = gasPrice * 21000n; // Standard transfer

      // Amount to recover (balance - gas cost for this transaction)
      const amountToRecover = balance - estimatedGasCost;

      if (amountToRecover <= 0n) {
        console.log(`[GasFundingService] Not enough balance to cover gas for recovery`);
        return {
          success: false,
          error: 'Not enough balance to cover gas'
        };
      }

      console.log(`[GasFundingService] Recovering ${ethers.formatEther(amountToRecover)} BNB`);
      console.log(`[GasFundingService] Estimated gas cost: ${ethers.formatEther(estimatedGasCost)} BNB`);

      // Send recovered BNB back to gas funding wallet
      const tx = await paymentWallet.sendTransaction({
        to: this.gasFundingWallet.address,
        value: amountToRecover,
        gasPrice: gasPrice
      });

      console.log(`[GasFundingService] Recovery transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      console.log(`[GasFundingService] ✅ Gas recovery successful!`);
      console.log(`[GasFundingService] Recovered: ${ethers.formatEther(amountToRecover)} BNB`);
      console.log(`[GasFundingService] TxHash: ${receipt?.hash}`);

      return {
        success: true,
        recovered: ethers.formatEther(amountToRecover),
        txHash: receipt?.hash
      };
    } catch (error: any) {
      console.error(`[GasFundingService] Error recovering gas:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get gas funding wallet status
   */
  async getStatus(): Promise<{
    address: string;
    balance: string;
    balanceUSD: string;
    estimatedSettlements: number;
  }> {
    const provider = this.providerService.getProvider();
    const balance = await provider.getBalance(this.gasFundingWallet.address);
    const balanceEther = ethers.formatEther(balance);

    // Estimate BNB price (hardcoded for now, can fetch from API)
    const bnbPriceUSD = 600; // $600 per BNB
    const balanceUSD = (parseFloat(balanceEther) * bnbPriceUSD).toFixed(2);

    // Estimate how many settlements can be done
    const gasPerSettlement = 0.001; // ~0.001 BNB per settlement
    const estimatedSettlements = Math.floor(parseFloat(balanceEther) / gasPerSettlement);

    return {
      address: this.gasFundingWallet.address,
      balance: balanceEther,
      balanceUSD: balanceUSD,
      estimatedSettlements
    };
  }

  /**
   * Get the gas funding wallet address (same as platform wallet)
   */
  getGasFundingWalletAddress(): string {
    return this.gasFundingWallet.address;
  }
}
