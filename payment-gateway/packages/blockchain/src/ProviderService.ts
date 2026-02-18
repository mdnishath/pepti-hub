// ProviderService - BSC Network Connection Management
import { ethers } from 'ethers';

export interface ProviderConfig {
  network: 'mainnet' | 'testnet';
  rpcUrl: string;
  fallbackRpcUrl?: string;
}

export class ProviderService {
  private provider: ethers.JsonRpcProvider;
  private fallbackProvider?: ethers.JsonRpcProvider;
  private network: 'mainnet' | 'testnet';
  private currentProvider: 'primary' | 'fallback' = 'primary';

  // Network chain IDs
  private readonly CHAIN_IDS = {
    mainnet: 56, // BSC Mainnet
    testnet: 97  // BSC Testnet
  };

  constructor(config: ProviderConfig) {
    this.network = config.network;

    // Initialize primary provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, {
      chainId: this.CHAIN_IDS[config.network],
      name: config.network === 'mainnet' ? 'bsc' : 'bsc-testnet'
    });

    // Initialize fallback provider if provided
    if (config.fallbackRpcUrl) {
      this.fallbackProvider = new ethers.JsonRpcProvider(config.fallbackRpcUrl, {
        chainId: this.CHAIN_IDS[config.network],
        name: config.network === 'mainnet' ? 'bsc' : 'bsc-testnet'
      });
    }

    console.log('[ProviderService] Initialized:', {
      network: config.network,
      chainId: this.CHAIN_IDS[config.network],
      hasFallback: !!this.fallbackProvider
    });
  }

  /**
   * Get active provider (with automatic fallback)
   */
  getProvider(): ethers.JsonRpcProvider {
    if (this.currentProvider === 'primary') {
      return this.provider;
    } else if (this.fallbackProvider) {
      return this.fallbackProvider;
    }
    return this.provider;
  }

  /**
   * Switch to fallback provider if available
   */
  switchToFallback(): boolean {
    if (this.fallbackProvider) {
      console.warn('[ProviderService] Switching to fallback provider');
      this.currentProvider = 'fallback';
      return true;
    }
    return false;
  }

  /**
   * Switch back to primary provider
   */
  switchToPrimary(): void {
    console.log('[ProviderService] Switching back to primary provider');
    this.currentProvider = 'primary';
  }

  /**
   * Check if provider is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const provider = this.getProvider();
      const blockNumber = await provider.getBlockNumber();
      return blockNumber > 0;
    } catch (error) {
      console.error('[ProviderService] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      const provider = this.getProvider();
      return await provider.getBlockNumber();
    } catch (error) {
      console.error('[ProviderService] Failed to get block number:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.getBlockNumber();
      }

      throw error;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const provider = this.getProvider();
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      console.error('[ProviderService] Failed to get gas price:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.getGasPrice();
      }

      throw error;
    }
  }

  /**
   * Get balance of an address (BNB balance)
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      const provider = this.getProvider();
      return await provider.getBalance(address);
    } catch (error) {
      console.error('[ProviderService] Failed to get balance:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.getBalance(address);
      }

      throw error;
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    try {
      const provider = this.getProvider();
      return await provider.getTransaction(txHash);
    } catch (error) {
      console.error('[ProviderService] Failed to get transaction:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.getTransaction(txHash);
      }

      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider();
      return await provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('[ProviderService] Failed to get receipt:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.getTransactionReceipt(txHash);
      }

      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   *
   * @param txHash - Transaction hash
   * @param confirmations - Number of confirmations to wait for
   * @param timeout - Timeout in milliseconds
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 12,
    timeout: number = 300000 // 5 minutes
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider();
      return await provider.waitForTransaction(txHash, confirmations, timeout);
    } catch (error) {
      console.error('[ProviderService] Failed waiting for transaction:', error);

      // Try fallback
      if (this.currentProvider === 'primary' && this.switchToFallback()) {
        return this.waitForTransaction(txHash, confirmations, timeout);
      }

      throw error;
    }
  }

  /**
   * Listen for new blocks
   *
   * @param callback - Function to call on each new block
   */
  onBlock(callback: (blockNumber: number) => void): void {
    const provider = this.getProvider();

    provider.on('block', (blockNumber) => {
      callback(blockNumber);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.provider.removeAllListeners();
    if (this.fallbackProvider) {
      this.fallbackProvider.removeAllListeners();
    }
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network> {
    const provider = this.getProvider();
    return await provider.getNetwork();
  }

  /**
   * Check if connected to correct network
   */
  async verifyNetwork(): Promise<boolean> {
    try {
      const network = await this.getNetwork();
      const expectedChainId = this.CHAIN_IDS[this.network];

      if (Number(network.chainId) !== expectedChainId) {
        console.error('[ProviderService] Wrong network:', {
          expected: expectedChainId,
          actual: network.chainId
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ProviderService] Failed to verify network:', error);
      return false;
    }
  }
}
