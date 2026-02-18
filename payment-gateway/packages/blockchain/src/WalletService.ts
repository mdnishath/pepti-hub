// WalletService - HD Wallet Management for PeptiPay
import { ethers } from 'ethers';

export interface WalletConfig {
  mnemonic: string;
  network: 'mainnet' | 'testnet';
}

export class WalletService {
  private baseNode: ethers.HDNodeWallet;
  private network: 'mainnet' | 'testnet';

  // BIP44 derivation path for Ethereum/BSC: m/44'/60'/0'/0/{index}
  // We'll store node at m/44'/60'/0'/0 and derive {index} from there
  private readonly BASE_PATH = "m/44'/60'/0'/0";

  constructor(config: WalletConfig) {
    this.network = config.network;

    // Create the actual master seed from mnemonic
    const mnemonic = ethers.Mnemonic.fromPhrase(config.mnemonic);
    // Create master node from seed (this is at depth 0, the true master)
    const masterNode = ethers.HDNodeWallet.fromSeed(mnemonic.computeSeed());
    // Derive to our base path m/44'/60'/0'/0
    this.baseNode = masterNode.derivePath(this.BASE_PATH);

    console.log('[WalletService] Initialized with base address:', this.baseNode.address);
  }

  /**
   * Generate a unique payment address for each order
   * Uses HD wallet derivation (BIP44)
   *
   * @param index - Unique index for this payment address
   * @returns Payment address (0x...)
   */
  derivePaymentAddress(index: number): string {
    // Derive child at index from base node (no "m/" prefix needed)
    const derivedWallet = this.baseNode.deriveChild(index);
    return derivedWallet.address;
  }

  /**
   * Get wallet instance for a specific index
   * Used when we need to sign transactions (e.g., forwarding payments)
   *
   * @param index - Address index
   * @param provider - Optional provider to connect wallet
   * @returns Wallet instance
   */
  getWallet(index: number, provider?: ethers.Provider): ethers.HDNodeWallet {
    const derivedWallet = this.baseNode.deriveChild(index);

    if (provider) {
      return derivedWallet.connect(provider) as ethers.HDNodeWallet;
    }

    return derivedWallet;
  }

  /**
   * Get the master wallet (platform hot wallet)
   * This is the first address at index 0
   * Used for collecting fees
   *
   * @param provider - Optional provider to connect wallet
   * @returns Master wallet instance
   */
  getMasterWallet(provider?: ethers.Provider): ethers.HDNodeWallet {
    // Master wallet is the first derived address (index 0)
    return this.getWallet(0, provider);
  }

  /**
   * Get master wallet address (platform hot wallet address)
   * This is the first address at index 0
   */
  getMasterAddress(): string {
    return this.baseNode.deriveChild(0).address;
  }

  /**
   * Verify mnemonic phrase is valid
   *
   * @param mnemonic - Mnemonic phrase to verify
   * @returns True if valid
   */
  static verifyMnemonic(mnemonic: string): boolean {
    try {
      ethers.Mnemonic.fromPhrase(mnemonic);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a new random mnemonic (12 words)
   * Use this only for creating new wallets, not in production
   */
  static generateMnemonic(): string {
    return ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
  }

  /**
   * Get private key for a specific address index
   * ⚠️ DANGEROUS: Only use for necessary operations like withdrawals
   *
   * @param index - Address index
   * @returns Private key (never log or expose this!)
   */
  private getPrivateKey(index: number): string {
    const derivedWallet = this.baseNode.deriveChild(index);
    return derivedWallet.privateKey;
  }

  /**
   * Sign a message with a specific address
   *
   * @param index - Address index
   * @param message - Message to sign
   * @returns Signature
   */
  async signMessage(index: number, message: string): Promise<string> {
    const wallet = this.getWallet(index);
    return wallet.signMessage(message);
  }

  /**
   * Verify a signature
   *
   * @param message - Original message
   * @param signature - Signature to verify
   * @param expectedAddress - Expected signer address
   * @returns True if signature is valid
   */
  static verifySignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}
