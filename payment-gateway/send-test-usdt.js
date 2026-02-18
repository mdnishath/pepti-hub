// Script to send test USDT to your wallet
// Run this with: node send-test-usdt.js

require('dotenv').config({ path: './packages/api/.env' });
const { ethers } = require('ethers');

const USDT_TESTNET = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';
const YOUR_WALLET = '0x73B99F713f33a461ca5A8ECd623C26323B44D3b6';
const AMOUNT = '100'; // 100 test USDT

const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function sendTestUSDT() {
  console.log('🚀 Starting test USDT transfer...\n');

  // Connect to BSC Testnet
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/'
  );

  // Load platform wallet
  const platformPrivateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;

  if (!platformPrivateKey) {
    console.error('❌ Error: PLATFORM_WALLET_PRIVATE_KEY not found in .env file');
    console.log('\n💡 You need to add your private key to .env file:');
    console.log('PLATFORM_WALLET_PRIVATE_KEY=your_private_key_here\n');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(platformPrivateKey, provider);
  console.log('✅ Connected to BSC Testnet');
  console.log('📍 Platform wallet:', wallet.address);

  // Check BNB balance (for gas)
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log('💰 BNB balance:', ethers.formatEther(bnbBalance), 'BNB');

  if (bnbBalance < ethers.parseEther('0.01')) {
    console.error('❌ Error: Platform wallet needs BNB for gas fees');
    console.log('💡 Get test BNB at: https://testnet.bnbchain.org/faucet-smart');
    console.log('   Send to:', wallet.address);
    process.exit(1);
  }

  // Connect to USDT contract
  const usdt = new ethers.Contract(USDT_TESTNET, USDT_ABI, wallet);

  // Check USDT balance
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log('💵 USDT balance:', ethers.formatUnits(usdtBalance, 18), 'USDT\n');

  if (usdtBalance < ethers.parseUnits(AMOUNT, 18)) {
    console.error(`❌ Error: Platform wallet doesn't have enough USDT`);
    console.log(`💡 Platform wallet needs at least ${AMOUNT} USDT to send`);
    console.log('\n🔧 Options:');
    console.log('1. Get USDT faucet for:', wallet.address);
    console.log('2. Swap BNB → USDT on PancakeSwap testnet');
    console.log('3. Use the simulator (simulate-payment.html) instead\n');
    process.exit(1);
  }

  // Send USDT
  console.log(`📤 Sending ${AMOUNT} USDT to ${YOUR_WALLET}...`);

  const tx = await usdt.transfer(YOUR_WALLET, ethers.parseUnits(AMOUNT, 18));
  console.log('⏳ Transaction sent:', tx.hash);
  console.log('🔗 View on BSCScan:', `https://testnet.bscscan.com/tx/${tx.hash}`);

  console.log('\n⏳ Waiting for confirmation...');
  const receipt = await tx.wait();

  if (receipt.status === 1) {
    console.log('\n✅ SUCCESS! Transfer completed!');
    console.log(`💰 You now have ${AMOUNT} test USDT in your wallet`);
    console.log(`📍 Your wallet: ${YOUR_WALLET}`);
    console.log(`🔗 Check balance: https://testnet.bscscan.com/address/${YOUR_WALLET}`);
    console.log('\n🎯 Next steps:');
    console.log('1. Open: test-payment.html');
    console.log('2. Create a payment');
    console.log('3. Send USDT to the payment address');
    console.log('4. Watch the magic happen! ✨\n');
  } else {
    console.log('\n❌ Transaction failed');
  }
}

// Run the script
sendTestUSDT().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
