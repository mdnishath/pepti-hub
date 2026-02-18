# 🚀 Production Testing Guide - Real USDT দিয়ে Test করুন

## 📋 আপনার Current Status:
- ✅ $15 সমপরিমাণ BNB আছে
- ✅ Payment Gateway সম্পূর্ণ ready
- ✅ System fully tested
- ✅ Ready for real money test!

---

## ⚠️ **IMPORTANT - Production এ যাওয়ার আগে:**

### **1. Backup নিন:**
```bash
# Database backup
cd payment-gateway/packages/api
pg_dump pptpay > backup_$(date +%Y%m%d).sql

# Code backup
cd ../..
git add .
git commit -m "Backup before production testing"
```

### **2. .env File Production Config:**

**Current (Testnet):**
```env
BLOCKCHAIN_NETWORK=testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

**Change to (Mainnet):**
```env
BLOCKCHAIN_NETWORK=mainnet
BSC_RPC_URL=https://bsc-dataseed1.binance.org:8545/
BSC_RPC_FALLBACK_URL=https://bsc-dataseed2.binance.org:8545/
```

---

## 🔧 **Step-by-Step Production Setup:**

### **Step 1: Environment Configuration**

Edit করুন: `payment-gateway/packages/api/.env`

**পরিবর্তন করুন:**
```env
# From testnet to mainnet
BLOCKCHAIN_NETWORK=mainnet

# Mainnet RPC URLs
BSC_RPC_URL=https://bsc-dataseed1.binance.org:8545/
BSC_RPC_FALLBACK_URL=https://bsc-dataseed2.binance.org:8545/

# Platform wallet আপনার real wallet এ change করুন
PLATFORM_HOT_WALLET=0x73B99F713f33a461ca5A8ECd623C26323B44D3b6

# IMPORTANT: Real private key লাগবে settlement এর জন্য
PLATFORM_WALLET_PRIVATE_KEY=your_real_private_key_here
```

---

### **Step 2: MetaMask BSC Mainnet এ Switch করুন**

**MetaMask Configuration:**
```
Network Name: Binance Smart Chain
RPC URL: https://bsc-dataseed1.binance.org
Chain ID: 56
Currency Symbol: BNB
Block Explorer: https://bscscan.com
```

**যদি already added থাকে:**
- Network dropdown → Select "Binance Smart Chain"
- Check আপনার BNB balance দেখা যাচ্ছে

---

### **Step 3: Real USDT পান**

**Option A: Swap BNB → USDT (Recommended)**

**PancakeSwap Mainnet:**
```
1. Go to: https://pancakeswap.finance/
2. Connect MetaMask
3. Swap: 0.01 BNB → USDT (≈ $5-6)
4. Keep বাকি BNB gas fees এর জন্য
5. Approve transaction
```

**Option B: CEX থেকে Withdraw**

যদি Binance/other exchange account থাকে:
```
1. Binance → Wallet → Withdraw
2. Select USDT
3. Network: BSC (BEP20)
4. Address: 0x73B99F713f33a461ca5A8ECd623C26323B44D3b6
5. Amount: $10 (test এর জন্য enough)
6. Confirm withdrawal
```

---

### **Step 4: Add Real USDT Token to MetaMask**

```
1. MetaMask open করুন
2. Make sure "Binance Smart Chain" selected
3. "Import tokens" click করুন
4. Contract Address: 0x55d398326f99059fF775485246999027B3197955
5. Token Symbol: USDT
6. Decimals: 18
7. "Import" click করুন
```

এখন আপনার USDT balance দেখা যাবে!

---

### **Step 5: Server Restart করুন (Mainnet Mode)**

**সব servers stop করুন:**
```bash
taskkill //F //IM node.exe
```

**API Server start করুন:**
```bash
cd payment-gateway/packages/api
pnpm dev
```

**Check Console - দেখবেন:**
```
[ProviderService] Initialized: { network: 'mainnet', chainId: 56, hasFallback: true }
```

✅ **"mainnet"** এবং **"chainId: 56"** দেখা মানে সঠিক!

---

## 💰 **Production Testing - Complete Flow:**

### **Test 1: Small Payment ($1 USDT)**

**1. Create Payment:**
```
Open: test-payment.html
Amount: 1 USDT
Click: "Create Payment Order"
```

**2. আপনি দেখবেন:**
```
Payment Address: 0xABC123... (mainnet address)
QR Code: Generated
Status: CREATED
Expires: 15 minutes
```

**3. Send Real USDT:**
```
MetaMask open করুন
Send 1 USDT
To: [Payment address from page]
Confirm (gas fee: ~$0.10)
```

**4. Watch Real-time Detection:**

**Server Console এ দেখবেন:**
```
[TransactionMonitor] 💰 Detected transfer: {
  from: '0x73B99...',
  to: '0xABC123...',
  amount: '1',
  currency: 'USDT',
  txHash: '0xreal_tx_hash...'
}
[TransactionMonitor] Confirmations: 1/12
[TransactionMonitor] Confirmations: 2/12
...
[TransactionMonitor] ✅ Payment confirmed (12/12)
[SettlementService] Transferring 0.975 USDT to merchant...
[SettlementService] Transferring 0.025 USDT to platform...
[SettlementService] ✅ Settlement successful
```

**5. Check Results:**

**Dashboard (http://localhost:3001):**
- Status: SETTLED ✅
- Amount: 1 USDT
- Fee: 0.025 USDT (2.5%)
- Net: 0.975 USDT

**BscScan (Real!):**
```
https://bscscan.com/address/YOUR_MERCHANT_WALLET
```
দেখবেন: 0.975 USDT received!

**Platform Wallet:**
```
https://bscscan.com/address/YOUR_PLATFORM_WALLET
```
দেখবেন: 0.025 USDT (fee) received!

---

### **Test 2: Medium Payment ($5 USDT)**

Same process, larger amount:
```
1. Create payment: 5 USDT
2. Send from MetaMask
3. Watch detection
4. Verify settlement
5. Check both wallets
```

**Expected Results:**
- Merchant receives: 4.875 USDT
- Platform receives: 0.125 USDT
- Total: 5 USDT ✅

---

## 📊 **Cost Breakdown - Production Testing:**

### **যা খরচ হবে:**

**Test 1 ($1 USDT):**
```
Payment: 1 USDT
Gas fee: ~0.10 USD (BNB)
Settlement gas: ~0.10 USD (automatic)
Total: ~$1.20
```

**Test 2 ($5 USDT):**
```
Payment: 5 USDT
Gas fee: ~0.10 USD
Settlement gas: ~0.10 USD
Total: ~$5.20
```

**Total Testing Cost:** ~$6.40 USD

**আপনার কাছে $15 আছে, তাই যথেষ্ট!** ✅

---

## ✅ **Verification Checklist:**

**After Each Test:**

- [ ] Payment detected within 12 seconds?
- [ ] Status changed: CREATED → PENDING?
- [ ] Confirmations counting: 1/12, 2/12...12/12?
- [ ] Status changed: PENDING → CONFIRMED?
- [ ] Settlement triggered automatically?
- [ ] Merchant wallet received net amount?
- [ ] Platform wallet received fee?
- [ ] Status changed: CONFIRMED → SETTLED?
- [ ] Transaction visible on BscScan?
- [ ] Dashboard shows correct data?

---

## 🔍 **BSCScan Links (Real Network):**

**Your Merchant Wallet:**
```
https://bscscan.com/address/0x73B99F713f33a461ca5A8ECd623C26323B44D3b6
```

**Payment Address (after creation):**
```
https://bscscan.com/address/[PAYMENT_ADDRESS]
```

**Transaction Hash (after payment):**
```
https://bscscan.com/tx/[TX_HASH]
```

---

## 💡 **Important Notes:**

### **1. Gas Fees:**
- প্রতিটা transaction এ ~$0.10 gas লাগবে
- Settlement automatic হয় (gas paid from platform wallet)
- যথেষ্ট BNB রাখুন gas এর জন্য

### **2. Private Key Security:**
```
⚠️ NEVER commit .env file to git
⚠️ NEVER share private key
⚠️ Use separate wallet for platform fees
⚠️ Keep backup of mnemonic/private key
```

### **3. Confirmation Time:**
- Testnet: ~36 seconds (12 blocks)
- Mainnet: ~36 seconds (12 blocks)
- Same speed! But real money! 💰

### **4. Settlement:**
- Automatic after 12 confirmations
- Transfers happen on-chain
- Gas fee paid from platform wallet
- Irreversible! Real blockchain!

---

## 🎯 **Testing Strategy:**

### **Phase 1: Tiny Test ($1)**
```
Goal: Verify complete flow works
Cost: ~$1.20
Risk: Minimal
```

### **Phase 2: Small Test ($5)**
```
Goal: Test with realistic amount
Cost: ~$5.20
Risk: Low
```

### **Phase 3: Ready for Production!**
```
Goal: Launch for real users
Cost: Per transaction basis
Risk: Mitigated by testing
```

---

## 📋 **Before Production Testing Checklist:**

- [ ] Database backup নেওয়া হয়েছে
- [ ] Code backup/commit করা হয়েছে
- [ ] .env file এ mainnet config করা হয়েছে
- [ ] MetaMask এ BSC Mainnet added
- [ ] Real USDT আছে wallet এ
- [ ] যথেষ্ট BNB আছে gas এর জন্য
- [ ] Platform wallet private key added
- [ ] Server logs monitor করার জন্য ready
- [ ] Dashboard accessible

---

## 🚀 **Quick Start Commands:**

**1. Stop all servers:**
```bash
taskkill //F //IM node.exe
```

**2. Edit .env file:**
```bash
# Change BLOCKCHAIN_NETWORK=testnet to mainnet
# Change RPC URLs to mainnet
```

**3. Start API server:**
```bash
cd payment-gateway/packages/api
pnpm dev
```

**4. Verify mainnet mode:**
```
Check console: Should show "network: 'mainnet', chainId: 56"
```

**5. Open test page:**
```
E:\pepti-hub\payment-gateway\test-payment.html
```

**6. Create payment and send real USDT!**

---

## 🎉 **Success Criteria:**

আপনার test successful যদি:
- ✅ Payment instantly detected হয়
- ✅ 12 confirmations properly counted
- ✅ Automatic settlement works
- ✅ Correct amounts transferred
- ✅ Dashboard shows accurate data
- ✅ BscScan এ সব transaction দেখা যায়

---

## 🆘 **Troubleshooting:**

**যদি payment detect না হয়:**
1. Check server running? (mainnet mode?)
2. Check transaction on BscScan - confirmed?
3. Check amount match করছে?
4. Check server logs কোনো error?

**যদি settlement fail হয়:**
1. Platform wallet এ BNB আছে?
2. Private key সঠিক?
3. Check console logs

**যদি dashboard data না দেখায়:**
1. Hard refresh: Ctrl+Shift+R
2. Check API server running?
3. Check browser console errors

---

## ✅ **আপনি Ready!**

**আপনার কাছে আছে:**
- ✅ $15 সমপরিমাণ BNB
- ✅ Complete payment gateway
- ✅ All documentation
- ✅ Testing tools

**এখন করুন:**
1. .env file edit করুন (mainnet)
2. BNB → USDT swap করুন ($10)
3. Server restart করুন
4. $1 test payment করুন
5. Real blockchain magic দেখুন! ✨

---

**Good luck! আপনার first real production payment successful হোক!** 🚀💰

**Questions? Issues? Let me know!**
