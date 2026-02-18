// TokenService - ERC20 Token Interaction (USDT, USDC, BUSD)
import { ethers } from 'ethers';
import { Currency } from '@pptpay/shared';

// Standard ERC20 ABI (minimal - only what we need)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export interface TokenConfig {
  network: 'mainnet' | 'testnet';
}

export class TokenService {
  private provider: ethers.Provider;
  private network: 'mainnet' | 'testnet';

  // Token contract addresses (BEP20 on BSC)
  private readonly TOKEN_ADDRESSES = {
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

  constructor(provider: ethers.Provider, config: TokenConfig) {
    this.provider = provider;
    this.network = config.network;

    console.log('[TokenService] Initialized for network:', config.network);
  }

  /**
   * Get token contract address for a currency
   */
  getTokenAddress(currency: Currency): string {
    const addresses = this.TOKEN_ADDRESSES[this.network];
    return addresses[currency as keyof typeof addresses];
  }

  /**
   * Get token contract instance
   */
  getTokenContract(currency: Currency): ethers.Contract {
    const address = this.getTokenAddress(currency);
    return new ethers.Contract(address, ERC20_ABI, this.provider);
  }

  /**
   * Get token balance of an address
   *
   * @param address - Wallet address to check
   * @param currency - Token type (USDT, USDC, or BUSD)
   * @returns Balance in token units (with decimals)
   */
  async getBalance(address: string, currency: Currency): Promise<string> {
    try {
      const contract = this.getTokenContract(currency);
      const balance = await contract.balanceOf(address);

      // Convert from wei to token units (18 decimals for USDT/USDC/BUSD)
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('[TokenService] Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get token decimals
   */
  async getDecimals(currency: Currency): Promise<number> {
    try {
      const contract = this.getTokenContract(currency);
      return await contract.decimals();
    } catch (error) {
      console.error('[TokenService] Failed to get decimals:', error);
      // Default to 18 for stablecoins
      return 18;
    }
  }

  /**
   * Get token symbol
   */
  async getSymbol(currency: Currency): Promise<string> {
    try {
      const contract = this.getTokenContract(currency);
      return await contract.symbol();
    } catch (error) {
      console.error('[TokenService] Failed to get symbol:', error);
      return currency;
    }
  }

  /**
   * Transfer tokens from wallet to another address
   *
   * @param wallet - Sender wallet (must have private key)
   * @param toAddress - Recipient address
   * @param amount - Amount in token units (e.g., "100" for 100 USDT)
   * @param currency - Token type
   * @returns Transaction hash
   */
  async transfer(
    wallet: ethers.Wallet,
    toAddress: string,
    amount: string,
    currency: Currency
  ): Promise<string> {
    try {
      const contract = this.getTokenContract(currency).connect(wallet) as ethers.Contract;

      // Convert amount to wei (18 decimals)
      const amountWei = ethers.parseUnits(amount, 18);

      // Execute transfer
      const tx = await contract.transfer(toAddress, amountWei);

      console.log('[TokenService] Transfer initiated:', {
        from: wallet.address,
        to: toAddress,
        amount,
        currency,
        txHash: tx.hash
      });

      return tx.hash;
    } catch (error) {
      console.error('[TokenService] Transfer failed:', error);
      throw error;
    }
  }

  /**
   * Monitor token transfers to a specific address
   * Uses polling instead of filters to avoid RPC node filter expiration issues
   *
   * @param address - Address to monitor
   * @param currency - Token type
   * @param callback - Function to call when transfer detected
   */
  monitorTransfers(
    address: string,
    currency: Currency,
    callback: (from: string, to: string, amount: string, txHash: string) => void
  ): void {
    const contract = this.getTokenContract(currency);

    // Use polling-based event listener instead of filters
    // This avoids "filter not found" errors from public RPC nodes
    const eventFilter = contract.filters.Transfer(null, address);

    // Set up event listener with error handling
    // Note: In ethers v6, event listeners receive a single event object parameter
    const listener = async (...args: any[]) => {
      try {
        // The last argument is always the event object
        const event = args[args.length - 1];

        // Extract from, to, value from event.args
        const from = event.args[0];
        const to = event.args[1];
        const value = event.args[2];

        // Validate inputs
        if (!value || value === null || value === undefined) {
          console.error('[TokenService] Invalid transfer value received:', { from, to, value });
          return;
        }

        if (!event || !event.log || !event.log.transactionHash) {
          console.error('[TokenService] Invalid event structure:', event);
          return;
        }

        const amount = ethers.formatUnits(value, 18);
        const txHash = event.log.transactionHash;

        console.log('[TokenService] Transfer detected:', {
          from,
          to,
          amount,
          currency,
          txHash
        });

        callback(from, to, amount, txHash);
      } catch (error) {
        console.error('[TokenService] Error processing transfer event:', error);
      }
    };

    // Use contract event listener with automatic reconnection
    contract.on(eventFilter, listener);

    // Store listener for cleanup
    if (!this.activeListeners) {
      this.activeListeners = new Map();
    }
    this.activeListeners.set(`${currency}_${address}`, { contract, filter: eventFilter, listener });

    console.log('[TokenService] Monitoring transfers to:', address);
  }

  private activeListeners?: Map<string, { contract: ethers.Contract; filter: any; listener: any }>;

  /**
   * Remove all listeners for a specific currency/address combination
   */
  removeListener(address: string, currency: Currency): void {
    const key = `${currency}_${address}`;
    const listenerInfo = this.activeListeners?.get(key);

    if (listenerInfo) {
      listenerInfo.contract.off(listenerInfo.filter, listenerInfo.listener);
      this.activeListeners?.delete(key);
      console.log('[TokenService] Removed listener for:', address);
    }
  }

  /**
   * Remove all active listeners
   */
  removeAllListeners(): void {
    if (this.activeListeners) {
      for (const [key, listenerInfo] of this.activeListeners.entries()) {
        listenerInfo.contract.off(listenerInfo.filter, listenerInfo.listener);
      }
      this.activeListeners.clear();
      console.log('[TokenService] Removed all listeners');
    }
  }

  /**
   * Stop monitoring transfers for a specific currency
   * @deprecated Use removeAllListeners() instead
   */
  stopMonitoring(currency: Currency): void {
    const contract = this.getTokenContract(currency);
    contract.removeAllListeners();
  }

  /**
   * Verify a transaction is a valid token transfer
   *
   * @param txHash - Transaction hash
   * @param expectedTo - Expected recipient address
   * @param expectedAmount - Expected amount (in token units)
   * @param currency - Token type
   * @returns True if transaction is valid
   */
  async verifyTransfer(
    txHash: string,
    expectedTo: string,
    expectedAmount: string,
    currency: Currency
  ): Promise<{
    valid: boolean;
    from?: string;
    to?: string;
    amount?: string;
    blockNumber?: number;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return { valid: false };
      }

      // Check if transaction succeeded
      if (receipt.status !== 1) {
        return { valid: false };
      }

      const tokenAddress = this.getTokenAddress(currency);

      // Find Transfer event in logs
      const contract = this.getTokenContract(currency);
      const transferEvent = receipt.logs.find((log) => {
        return (
          log.address.toLowerCase() === tokenAddress.toLowerCase() &&
          log.topics[0] === ethers.id('Transfer(address,address,uint256)')
        );
      });

      if (!transferEvent) {
        return { valid: false };
      }

      // Parse Transfer event
      const parsedLog = contract.interface.parseLog({
        topics: [...transferEvent.topics],
        data: transferEvent.data
      });

      if (!parsedLog) {
        return { valid: false };
      }

      const from = parsedLog.args[0];
      const to = parsedLog.args[1];
      const value = parsedLog.args[2];
      const amount = ethers.formatUnits(value, 18);

      // Verify recipient matches
      if (to.toLowerCase() !== expectedTo.toLowerCase()) {
        return { valid: false, from, to, amount, blockNumber: receipt.blockNumber };
      }

      // Verify amount matches (with small tolerance for rounding)
      const expectedAmountBN = ethers.parseUnits(expectedAmount, 18);
      const tolerance = ethers.parseUnits('0.000001', 18); // 0.000001 token tolerance

      const diff = value > expectedAmountBN
        ? value - expectedAmountBN
        : expectedAmountBN - value;

      if (diff > tolerance) {
        return {
          valid: false,
          from,
          to,
          amount,
          blockNumber: receipt.blockNumber
        };
      }

      return {
        valid: true,
        from,
        to,
        amount,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('[TokenService] Verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get transaction confirmations
   *
   * @param txHash - Transaction hash
   * @returns Number of confirmations
   */
  async getConfirmations(txHash: string): Promise<number> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx || !tx.blockNumber) {
        return 0;
      }

      const currentBlock = await this.provider.getBlockNumber();
      return currentBlock - tx.blockNumber + 1;
    } catch (error) {
      console.error('[TokenService] Failed to get confirmations:', error);
      return 0;
    }
  }

  /**
   * Check if an address has enough balance for a payment
   *
   * @param address - Address to check
   * @param requiredAmount - Required amount in token units
   * @param currency - Token type
   * @returns True if balance is sufficient
   */
  async hasSufficientBalance(
    address: string,
    requiredAmount: string,
    currency: Currency
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(address, currency);
      const balanceBN = ethers.parseUnits(balance, 18);
      const requiredBN = ethers.parseUnits(requiredAmount, 18);

      return balanceBN >= requiredBN;
    } catch (error) {
      console.error('[TokenService] Failed to check balance:', error);
      return false;
    }
  }
}
