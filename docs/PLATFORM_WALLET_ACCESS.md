# 🔐 Platform Wallet - Private Key Access Guide

## 🎯 Platform Wallet Info:

**Address**: `0xAB5466e8F022D69Fefd36bab3fF226908BeD1443`

**Purpose**:
- Receives 2.5% platform fee from every settlement
- Used as gas funding wallet (sends BNB to payment addresses)
- Your revenue wallet (developer earnings)

**Current Balance**: Check on BscScan
https://bscscan.com/address/0xAB5466e8F022D69Fefd36bab3fF226908BeD1443

---

## 🔑 How to Access Private Key:

### Option 1: From .env File (Recommended)

Your `.env` file location:
```
e:\pepti-hub\payment-gateway\.env
```

Look for this line:
```
WALLET_MNEMONIC="your 12 word seed phrase here"
```

**This is your master seed phrase!**

---

### Option 2: Generate Private Key from Code

Run this script to get the private key:

```typescript
// File: get-platform-wallet-key.ts
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mnemonic = process.env.WALLET_MNEMONIC;

if (!mnemonic) {
  console.error('❌ WALLET_MNEMONIC not found in .env');
  process.exit(1);
}

// Create HD wallet from mnemonic
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

// Platform wallet is at index 0
const platformWallet = hdNode.deriveChild(0);

console.log('\n🔐 Platform Wallet Details:\n');
console.log('Address:', platformWallet.address);
console.log('Private Key:', platformWallet.privateKey);
console.log('\n⚠️  KEEP THIS PRIVATE KEY SECRET! Never share it!\n');
```

Save this script and run:
```bash
cd e:\pepti-hub\payment-gateway\packages\api\src
npx tsx get-platform-wallet-key.ts
```

---

## 💰 How to Withdraw Platform Revenue:

### Method 1: Using MetaMask/Trust Wallet

1. **Import Wallet:**
   - Open MetaMask
   - Click "Import Account"
   - Paste private key
   - Or use seed phrase to import

2. **Connect to BSC Mainnet:**
   - Network: Binance Smart Chain
   - RPC URL: https://bsc-dataseed.binance.org/
   - Chain ID: 56

3. **View Balance:**
   - You'll see your USDT balance
   - Also BNB balance (for gas)

4. **Transfer USDT:**
   - Send to your personal wallet
   - Keep some BNB for gas

---

### Method 2: Using Admin Panel (We're building this!)

**Feature**: Withdraw tab in admin panel

```
┌──────────────────────────────────────────────┐
│  Platform Wallet Withdrawal                  │
│                                              │
│  Current Balance: 7.5 USDT                  │
│  Wallet: 0xAB54...1443                      │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Your Withdrawal Address                 │ │
│  │ [0x________________..._______________]  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Amount (USDT)                           │ │
│  │ [______]  [Withdraw All]               │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [Withdraw] button                           │
└──────────────────────────────────────────────┘
```

---

### Method 3: Using Code (Advanced)

```typescript
import { ethers } from 'ethers';
import { WalletService } from '@pptpay/blockchain';

// Initialize wallet service
const walletService = new WalletService(mnemonic);
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// Get platform wallet
const platformWallet = walletService.getWallet(0, provider);

// USDT contract on BSC
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const usdtAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, platformWallet);

// Check balance
const balance = await usdtContract.balanceOf(platformWallet.address);
console.log('Balance:', ethers.formatUnits(balance, 18), 'USDT');

// Transfer to your personal wallet
const yourPersonalWallet = '0xYourPersonalWalletAddress';
const tx = await usdtContract.transfer(yourPersonalWallet, balance);
await tx.wait();

console.log('✅ Withdrawal complete!');
console.log('TxHash:', tx.hash);
```

---

## ⚠️ Security Best Practices:

### 1. **Backup Your Seed Phrase**
```
Location: e:\pepti-hub\payment-gateway\.env
Line: WALLET_MNEMONIC="..."

⚠️ Write it down on paper
⚠️ Store in safe place
⚠️ Never store in cloud
⚠️ Never share with anyone
```

### 2. **Use Cold Wallet for Large Amounts**
```
Hot Wallet (Platform): Keep operational amount only (~$100)
Cold Wallet (Your safe): Store bulk of revenue

Weekly routine:
1. Withdraw from platform wallet
2. Transfer to cold wallet
3. Keep minimum in platform wallet
```

### 3. **Monitor Transactions**
```
BscScan: https://bscscan.com/address/0xAB5466e8F022D69Fefd36bab3fF226908BeD1443

Check regularly for:
- Incoming fees (2.5% from settlements)
- Outgoing gas funding (to payment addresses)
- Any unauthorized transactions
```

### 4. **Set Up Alerts**
```
Option 1: BscScan email alerts
- Go to BscScan
- Register account
- Add address to watchlist
- Enable email notifications

Option 2: Admin panel monitoring
- We'll build real-time monitoring
- Alert if balance drops unexpectedly
- Alert if unauthorized withdrawal
```

---

## 💰 Revenue Calculation:

### Example:
```
10 customers pay 100 USDT each = 1000 USDT total volume

Your earnings:
├─ Platform fee: 1000 × 2.5% = 25 USDT
├─ Gas costs: 10 settlements × $0.60 = ~6 USDT equivalent
└─ Net profit: 25 - 6 = ~19 USDT

Per transaction profit: ~1.9 USDT
```

### Monthly Projection:
```
100 transactions/month × 100 USDT average
= 10,000 USDT volume

Revenue:
├─ Platform fees: 250 USDT
├─ Gas costs: ~60 USDT
└─ Net profit: ~190 USDT/month
```

---

## 🔧 Platform Wallet Management:

### Current Setup:
```
Platform Wallet (0xAB54...1443)
├─ Role 1: Revenue collection (2.5% fees)
├─ Role 2: Gas funding (sends BNB to payment addresses)
└─ Balance: USDT (revenue) + BNB (for gas funding)
```

### Recommended Setup:
```
1. Platform Wallet (Hot) - Operational
   ├─ USDT: Minimal (~$50)
   ├─ BNB: 0.1-0.5 BNB (~$60-300 for gas)
   └─ Purpose: Daily operations

2. Revenue Wallet (Cold) - Storage
   ├─ USDT: Bulk of earnings
   ├─ BNB: None needed
   └─ Purpose: Long-term storage

Transfer hot → cold weekly
```

---

## 📊 Monitoring Dashboard:

### We're building these features:

1. **Real-time Balance**
   - USDT balance
   - BNB balance
   - USD equivalent

2. **Revenue Analytics**
   - Total earned (all time)
   - This month
   - This week
   - Today

3. **Gas Usage Stats**
   - BNB spent on gas
   - Settlements funded
   - Average gas per settlement
   - Estimated days remaining

4. **Transaction History**
   - Incoming fees
   - Outgoing gas funding
   - Withdrawals
   - Filter by date/type

5. **Withdrawal Management**
   - One-click withdraw
   - Scheduled withdrawals
   - Withdrawal history
   - Email notifications

---

## 🎯 Summary:

### Platform Wallet:
- **Address**: 0xAB5466e8F022D69Fefd36bab3fF226908BeD1443
- **Private Key**: Get from `.env` file or generate from seed phrase
- **Purpose**: Revenue + Gas funding
- **Access**: MetaMask, Trust Wallet, or Admin Panel

### Your Revenue:
- **Source**: 2.5% from every settlement
- **Current Balance**: Check BscScan
- **Withdraw**: MetaMask or Admin Panel (building)

### Security:
- ✅ Backup seed phrase
- ✅ Use cold wallet for bulk
- ✅ Monitor regularly
- ✅ Set up alerts

---

## 🚀 Next Steps:

1. ✅ Find your seed phrase in `.env`
2. ✅ Backup seed phrase safely
3. ✅ Import to MetaMask (optional)
4. ⏳ Wait for admin panel withdraw feature (building now!)
5. ✅ Withdraw revenue regularly

**Your platform wallet is your revenue stream!** 💰

All platform fees accumulate here. Monitor it regularly and withdraw to your personal wallet for safety! 🔐
