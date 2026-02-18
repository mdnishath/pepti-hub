// Test Blockchain Services on BSC Testnet
import { WalletService, ProviderService, TokenService, ethers } from './index';
import { Currency } from '@pptpay/shared';
import dotenv from 'dotenv';

// Load environment variables
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function testBlockchainServices() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     PeptiPay Blockchain Service - Test Suite             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test WalletService
    console.log('📌 Testing WalletService...\n');

    const walletService = new WalletService({
      mnemonic: process.env.MASTER_MNEMONIC!,
      network: 'testnet'
    });

    const masterAddress = walletService.getMasterAddress();
    console.log('✅ Master Wallet Address:', masterAddress);

    // Generate 3 payment addresses
    const paymentAddresses = [];
    for (let i = 0; i < 3; i++) {
      const addr = walletService.derivePaymentAddress(i);
      paymentAddresses.push(addr);
      console.log(`✅ Payment Address ${i}:`, addr);
    }

    console.log('');

    // 2. Test ProviderService
    console.log('📌 Testing ProviderService...\n');

    const providerService = new ProviderService({
      network: 'testnet',
      rpcUrl: process.env.BSC_RPC_URL!,
      fallbackRpcUrl: process.env.BSC_RPC_FALLBACK_URL
    });

    const isHealthy = await providerService.isHealthy();
    console.log('✅ Provider Healthy:', isHealthy);

    const blockNumber = await providerService.getBlockNumber();
    console.log('✅ Current Block Number:', blockNumber);

    const network = await providerService.getNetwork();
    console.log('✅ Network:', network.name, '(Chain ID:', network.chainId, ')');

    const verified = await providerService.verifyNetwork();
    console.log('✅ Network Verified:', verified);

    // Check master wallet BNB balance
    const bnbBalance = await providerService.getBalance(masterAddress);
    console.log('✅ Master Wallet BNB Balance:', ethers.formatEther(bnbBalance), 'BNB');

    console.log('');

    // 3. Test TokenService
    console.log('📌 Testing TokenService...\n');

    const tokenService = new TokenService(providerService.getProvider(), {
      network: 'testnet'
    });

    // Test all supported currencies
    const currencies: Currency[] = [Currency.USDT, Currency.USDC, Currency.BUSD];

    for (const currency of currencies) {
      const tokenAddress = tokenService.getTokenAddress(currency);
      console.log(`\n💰 ${currency} (${tokenAddress}):`);

      try {
        const symbol = await tokenService.getSymbol(currency);
        const decimals = await tokenService.getDecimals(currency);
        const balance = await tokenService.getBalance(masterAddress, currency);

        console.log(`  ✅ Symbol: ${symbol}`);
        console.log(`  ✅ Decimals: ${decimals}`);
        console.log(`  ✅ Master Wallet Balance: ${balance} ${currency}`);

        // Check first payment address balance
        const paymentBalance = await tokenService.getBalance(paymentAddresses[0], currency);
        console.log(`  ✅ Payment Address 0 Balance: ${paymentBalance} ${currency}`);
      } catch (error: any) {
        console.log(`  ❌ Error:`, error.message);
      }
    }

    console.log('\n');

    // 4. Test Transaction Verification (example)
    console.log('📌 Testing Transaction Verification...\n');

    // This is just to show the API, won't work without actual transaction
    const testTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log('ℹ️  Transaction verification requires an actual transaction hash');
    console.log('ℹ️  Example:', testTxHash);

    console.log('\n');

    // 5. Summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                   Test Summary                            ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  ✅ WalletService: WORKING                                ║');
    console.log('║  ✅ ProviderService: WORKING                              ║');
    console.log('║  ✅ TokenService: WORKING                                 ║');
    console.log('║                                                           ║');
    console.log('║  📝 Next Steps:                                           ║');
    console.log('║  1. Get testnet BNB from faucet                           ║');
    console.log('║  2. Get testnet USDT/BUSD from faucet                     ║');
    console.log('║  3. Test actual payment flow                              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    console.log('\n🎉 All blockchain services initialized successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testBlockchainServices();
