// Check Past Payments Script
// This script checks if there are any USDT transactions to a payment address

const { ethers } = require('ethers');

// BSC Mainnet Configuration
const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

// Payment address to check
const PAYMENT_ADDRESS = '0x5C1193b9456bc7Ea64Ee66bf109a9f76fea68d24';

// USDT ABI (just Transfer event)
const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

async function checkPastPayments() {
  console.log('🔍 Checking past USDT transactions...\n');

  try {
    // Connect to BSC
    const provider = new ethers.JsonRpcProvider(BSC_RPC);
    const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Current Block: ${currentBlock}\n`);

    // Check last 10,000 blocks (about 8 hours on BSC)
    const fromBlock = currentBlock - 10000;

    console.log(`🔎 Searching from block ${fromBlock} to ${currentBlock}...`);
    console.log(`   Payment Address: ${PAYMENT_ADDRESS}\n`);

    // Query Transfer events to this address
    const filter = usdtContract.filters.Transfer(null, PAYMENT_ADDRESS);
    const events = await usdtContract.queryFilter(filter, fromBlock, currentBlock);

    if (events.length === 0) {
      console.log('❌ No USDT transactions found in last ~8 hours\n');
      console.log('💡 Possible reasons:');
      console.log('   1. আপনি এই address এ USDT পাঠাননি');
      console.log('   2. Transaction 8 hours এর বেশি পুরাতন');
      console.log('   3. ভুল network এ payment করেছেন (testnet vs mainnet)');
      console.log('   4. Payment address টা ভুল ছিল\n');

      console.log('✅ Solution: নতুন payment তৈরি করুন এবং test করুন!');
      return;
    }

    console.log(`✅ Found ${events.length} transaction(s)!\n`);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const block = await event.getBlock();
      const tx = await event.getTransaction();

      const amount = ethers.formatUnits(event.args.value, 18); // USDT has 18 decimals

      console.log(`Transaction ${i + 1}:`);
      console.log(`  💰 Amount: ${amount} USDT`);
      console.log(`  📤 From: ${event.args.from}`);
      console.log(`  📥 To: ${event.args.to}`);
      console.log(`  🔗 TxHash: ${tx.hash}`);
      console.log(`  📦 Block: ${event.blockNumber}`);
      console.log(`  📅 Time: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log(`  🔍 BscScan: https://bscscan.com/tx/${tx.hash}`);
      console.log('');
    }

    console.log('🎯 Next Steps:');
    console.log('   1. এই transactions database এ manually add করতে হবে');
    console.log('   2. অথবা নতুন করে payment test করুন real-time detection এর জন্য\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('timeout')) {
      console.log('\n⚠️  RPC timeout error. অন্য RPC endpoint try করুন।');
    }
  }
}

// Run the check
checkPastPayments().catch(console.error);
