// Generate Master Wallet for PeptiPay Gateway
// IMPORTANT: Run "pnpm install" first!

try {
  const ethers = require('ethers');

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         PeptiPay Gateway - Wallet Generation             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log('MASTER_MNEMONIC="' + wallet.mnemonic.phrase + '"');
  console.log('PLATFORM_HOT_WALLET=' + wallet.address);

  console.log('\n⚠️  CRITICAL SECURITY WARNINGS:\n');
  console.log('1. SAVE THE MNEMONIC PHRASE ABOVE IN A SAFE PLACE!');
  console.log('2. Write it down on paper (offline backup)');
  console.log('3. NEVER share this mnemonic with anyone');
  console.log('4. NEVER commit .env file to git');
  console.log('5. This mnemonic controls all funds in this wallet\n');

  console.log('📋 Next Steps:\n');
  console.log('1. Copy the MASTER_MNEMONIC value above');
  console.log('2. Paste it in your .env file');
  console.log('3. Copy the PLATFORM_HOT_WALLET address');
  console.log('4. Paste it in your .env file');
  console.log('5. Save the .env file\n');

  console.log('═══════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('\n❌ Error: ethers package not found!\n');
  console.log('Please run: pnpm install');
  console.log('Then try again: node generate-wallet.js\n');
  process.exit(1);
}
