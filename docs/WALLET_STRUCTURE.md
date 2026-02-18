# 🏦 PeptiPay Wallet Structure - Visual Explanation

## 📊 Complete Money Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER (Buyer)                                │
│                     💳 Wallet: 0x1234...                            │
│                     Balance: 1000 USDT                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Buys product for 100 USDT
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│              PAYMENT GATEWAY (PeptiPay System)                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  MASTER HD WALLET (BIP44)                                  │   │
│  │  Seed Phrase: "word1 word2 word3 ... word12"             │   │
│  │  Base Address: 0xAB5466e8F022D69Fefd36bab3fF226908BeD1443│   │
│  │                                                             │   │
│  │  Derivation Path: m/44'/60'/0'/0/N                        │   │
│  │  (N = address index: 0, 1, 2, 3, ...)                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                │
│         │                    │                    │                 │
│         ↓                    ↓                    ↓                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │ Address 0    │    │ Address 1    │    │ Address 2    │        │
│  │ Order #123   │    │ Order #124   │    │ Order #125   │        │
│  │ 0x44ff...C5a │    │ 0x6A19...0b2 │    │ 0xab80...9BF │        │
│  │              │    │              │    │              │        │
│  │ 💰 100 USDT  │    │ 💰 100 USDT  │    │ 💰 100 USDT  │        │
│  │ [CONFIRMED]  │    │ [CONFIRMED]  │    │ [CONFIRMED]  │        │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘        │
│         │                   │                    │                 │
│         │   SETTLEMENT      │   SETTLEMENT       │   SETTLEMENT    │
│         │   PROCESS         │   PROCESS          │   PROCESS       │
│         │                   │                    │                 │
└─────────┼───────────────────┼────────────────────┼─────────────────┘
          │                   │                    │
          │ Transfer 97.5 USDT│ Transfer 97.5 USDT│ Transfer 97.5 USDT
          │ (Net Amount)      │ (Net Amount)       │ (Net Amount)
          │                   │                    │
          ↓                   ↓                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  MERCHANT WALLET (Your Wallet)                      │
│                  0x742D35CC6634c0532925A3b844BC9E7595F0BEb0        │
│                                                                      │
│  💰 Balance: 292.5 USDT (97.5 × 3 payments)                        │
│  ✅ You receive 97.5% of each payment                              │
└─────────────────────────────────────────────────────────────────────┘
          ┌───────────────────┬────────────────────┐
          │ Transfer 2.5 USDT │ Transfer 2.5 USDT  │ Transfer 2.5 USDT
          │ (Platform Fee)    │ (Platform Fee)     │ (Platform Fee)
          │                   │                    │
          ↓                   ↓                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                PLATFORM WALLET (Developer Revenue)                  │
│                0xAB5466e8F022D69Fefd36bab3fF226908BeD1443          │
│                                                                      │
│  💰 Balance: 7.5 USDT (2.5 × 3 payments)                           │
│  ✅ Platform receives 2.5% of each payment                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Single Payment Lifecycle:

### Stage 1: Payment Created
```
Customer orders product (100 USDT)
         ↓
PeptiPay generates unique address
         ↓
Address: 0x44ffC66eEac4Af39Cd705f9b9125DeC0c2016C5a
Index: 5 (stored in database)
Status: CREATED ⏳
```

### Stage 2: Customer Sends Payment
```
Customer wallet sends 100 USDT
         ↓
Payment Address receives USDT
         ↓
Status: CREATED → PENDING 🔄
TransactionMonitor watching...
```

### Stage 3: Confirmations
```
Block 1 → 0 confirmations
Block 2 → 1 confirmation
Block 3 → 2 confirmations
...
Block 13 → 12 confirmations ✅
         ↓
Status: PENDING → CONFIRMED ✅
```

### Stage 4: Settlement Check
```
SettlementService checks every 30 seconds:
├─ Status = CONFIRMED? ✅
├─ Confirmations >= 12? ✅
├─ BNB available for gas? ✅
└─ Balance = expected amount? ✅
         ↓
Ready to settle!
```

### Stage 5: Settlement Execution
```
Transaction 1:
├─ From: Payment Address (0x44ff...)
├─ To: Merchant Wallet (0x742D...)
├─ Amount: 97.5 USDT
└─ Gas: ~0.0005 BNB
         ↓
Transaction 2:
├─ From: Payment Address (0x44ff...)
├─ To: Platform Wallet (0xAB54...)
├─ Amount: 2.5 USDT
└─ Gas: ~0.0005 BNB
         ↓
Total Gas Used: ~0.001 BNB (~$0.60)
```

### Stage 6: Completed
```
Payment Address: 0 USDT (empty) ✅
Merchant Wallet: +97.5 USDT ✅
Platform Wallet: +2.5 USDT ✅
Status: CONFIRMED → SETTLED ✅
```

---

## 💡 Why Unique Addresses Per Order?

### ❌ **Without Unique Addresses (Problems):**
```
Single Address: 0x1234...5678

Customer A pays 50 USDT  → 0x1234...5678
Customer B pays 50 USDT  → 0x1234...5678
Customer C pays 100 USDT → 0x1234...5678

Total: 200 USDT in one address

❌ Problems:
- Which payment is for which order?
- Customer A's payment mixed with B and C
- Can't track individual orders
- Settlement confusion
- Refund impossible to identify
```

### ✅ **With Unique Addresses (Clean):**
```
Order A (50 USDT)  → Address 0: 0x44ff...C5a
Order B (50 USDT)  → Address 1: 0x6A19...0b2
Order C (100 USDT) → Address 2: 0xab80...9BF

✅ Benefits:
- Clear tracking per order
- Easy settlement management
- Individual refund possible
- No confusion
- Industry standard (Stripe, PayPal, Coinbase)
```

---

## 🔐 Security: HD Wallet Explained

### What is HD (Hierarchical Deterministic) Wallet?

```
┌──────────────────────────────────────────────────────────┐
│  SEED PHRASE (12 words - KEEP SECRET!)                  │
│  "word1 word2 word3 word4 word5 word6 ..."             │
│                                                          │
│  From this ONE seed, generate INFINITE addresses!        │
└──────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
   Address 0       Address 1       Address 2
   0x44ff...       0x6A19...       0xab80...
        │               │               │
        ↓               ↓               ↓
   Address 3       Address 4       Address 5
   0x9485...       0xe46e...       0x7a21...
        │               │               │
        ...             ...             ...
   (infinite addresses possible)
```

### Benefits:
1. **Single Backup**: One seed phrase backs up all addresses
2. **Deterministic**: Same seed always generates same addresses
3. **Index Based**: Address N = derive(seed, N)
4. **Recovery**: Lost address? Use index to recover!

### Example Recovery:
```javascript
// Lost access to Address 5?
const seed = "word1 word2 word3..."; // Your backup
const wallet = HDWallet.fromSeed(seed);
const address5 = wallet.deriveChild(5);
// Now you have access again! ✅
```

---

## 💰 Real Money Example:

### Merchant sells 3 products:

**Product A: T-shirt (50 USDT)**
```
Payment Address: 0x44ffC66eEac4Af39Cd705f9b9125DeC0c2016C5a
Customer pays: 50 USDT
Settlement:
├─ Merchant receives: 48.75 USDT (97.5%)
└─ Platform receives: 1.25 USDT (2.5%)
Gas cost: 0.001 BNB (~$0.60)
```

**Product B: Shoes (100 USDT)**
```
Payment Address: 0x6A196218E9C96e85ae7286bbcAdACBbfF67380b2
Customer pays: 100 USDT
Settlement:
├─ Merchant receives: 97.5 USDT (97.5%)
└─ Platform receives: 2.5 USDT (2.5%)
Gas cost: 0.001 BNB (~$0.60)
```

**Product C: Laptop (500 USDT)**
```
Payment Address: 0xab80A7bB19f22bB8035A847128d48Ad426e169BF
Customer pays: 500 USDT
Settlement:
├─ Merchant receives: 487.5 USDT (97.5%)
└─ Platform receives: 12.5 USDT (2.5%)
Gas cost: 0.001 BNB (~$0.60)
```

### **Total:**
```
Merchant Total Revenue: 48.75 + 97.5 + 487.5 = 633.75 USDT ✅
Platform Total Revenue: 1.25 + 2.5 + 12.5 = 16.25 USDT ✅
Total Gas Cost: 0.003 BNB (~$1.80)

Merchant Net Profit: 633.75 USDT - $1.80 gas = ~631.95 USDT 💰
```

---

## 🛠️ Admin Panel - Manual Control

### Access:
```
URL: http://localhost:3001/admin
Password: admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

### Features:

#### 1. View All Pending Settlements
```
┌──────────────────────────────────────────────────────────┐
│ Order ID    │ Amount  │ Address           │ Status      │
├──────────────────────────────────────────────────────────┤
│ order_123   │ 50 USDT │ 0x44ff...         │ CONFIRMED   │
│ order_124   │ 100 USDT│ 0x6A19...         │ CONFIRMED   │
│ order_125   │ 500 USDT│ 0xab80...         │ CONFIRMED   │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Click "Process All Settlements"
                        ↓
              Settles all 3 payments at once!
```

#### 2. View Platform Revenue
```
Total Platform Revenue: 16.25 USDT
Total Volume Processed: 650 USDT
Total Merchants: 5
Platform Wallet: 0xAB5466e8F022D69Fefd36bab3fF226908BeD1443
```

#### 3. Manual Recovery
```
If payment stuck:
1. Find payment in admin panel
2. Check payment address on BscScan
3. Verify USDT balance
4. Click "Manual Settle" button
5. System handles rest
```

---

## 📋 Database Structure:

```sql
PaymentOrder {
  id: uuid
  orderId: string
  merchantId: uuid

  -- Payment details
  amount: 100 USDT
  feeAmount: 2.5 USDT
  netAmount: 97.5 USDT

  -- Address info
  paymentAddress: "0x44ff..."
  addressIndex: 5  ← KEY for recovery!

  -- Status tracking
  status: SETTLED
  createdAt: timestamp
  confirmedAt: timestamp
  settledAt: timestamp
}
```

**The `addressIndex` is crucial!**
```javascript
// Anytime you need to access that address:
const wallet = masterWallet.deriveChild(5);
// Now you control 0x44ff... address!
```

---

## 🎯 Summary:

### ✅ **Clear Answers:**

1. **Payment address kar?**
   - Temporary holding address, uniquely generated per order

2. **Balance kothay?**
   - Payment addresses (temporary) → Your wallet (settled) + Platform wallet (fee)

3. **Protibar notun address?**
   - Yes! Security + tracking + industry standard

4. **Protibar gas fee?**
   - Yes, but profitable. Solution: batch settlements, auto gas funding

5. **Developer 2.5% koi?**
   - Platform wallet: 0xAB5466e8F022D69Fefd36bab3fF226908BeD1443

6. **Bhule jaoa taka recover?**
   - 100% possible! addressIndex + seed phrase = full recovery

7. **Admin panel?**
   - http://localhost:3001/admin - full control

---

## 🚀 Next Steps:

আপনি এখন যা করতে পারেন:

1. ✅ Admin panel access করুন
2. ✅ Pending settlements process করুন
3. ✅ Platform revenue check করুন
4. ✅ Real merchant হিসেবে test করুন

**Need more features?**
- Auto gas funding system
- Webhook notifications
- Email alerts
- Recovery tools
- Analytics dashboard

Just ask! 💪
