// Generate secrets for PeptiPay Gateway
const crypto = require('crypto');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║         PeptiPay Gateway - Secret Generation             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Encryption Key
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// Generate Webhook Signing Secret
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('WEBHOOK_SIGNING_SECRET=' + webhookSecret);

console.log('\n⚠️  IMPORTANT: Copy these values to your .env file!\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Note about wallet generation
console.log('⚠️  WALLET GENERATION:');
console.log('Wallet generation requires ethers.js package.');
console.log('Run "pnpm install" first, then run "node generate-wallet.js"\n');
