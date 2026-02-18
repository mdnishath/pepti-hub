// Script to get platform wallet private key
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment from root
const rootEnvPath = path.join(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const mnemonic = process.env.WALLET_MNEMONIC;

if (!mnemonic) {
  console.error('\n❌ ERROR: WALLET_MNEMONIC not found in .env file');
  console.error('Location:', rootEnvPath);
  process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔐  PLATFORM WALLET DETAILS');
console.log('═══════════════════════════════════════════════════════════\n');

// Create HD wallet from mnemonic
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

// Platform wallet is at index 0 (base wallet)
const platformWallet = hdNode.deriveChild(0);

console.log('Address:      ', platformWallet.address);
console.log('Private Key:  ', platformWallet.privateKey);
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️   KEEP THIS PRIVATE KEY SECRET!');
console.log('⚠️   Never share it with anyone!');
console.log('⚠️   Never commit to git!');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📝 How to use:\n');
console.log('1. Import to MetaMask:');
console.log('   - Click "Import Account"');
console.log('   - Paste private key above');
console.log('   - Connect to BSC Mainnet\n');

console.log('2. Check balance on BscScan:');
console.log(`   https://bscscan.com/address/${platformWallet.address}\n`);

console.log('3. Withdraw USDT:');
console.log('   - Send to your personal wallet');
console.log('   - Keep some BNB for gas\n');
