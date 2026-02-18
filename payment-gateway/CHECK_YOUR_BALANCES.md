# 💰 আপনার Payment Balances Check করুন (Bangla)

## 🎯 আপনার Confirmed Payments:

### Payment 1: order_hj4jwyxoyfcvvvv6
**Amount:** 0.1 USDT
**Status:** CONFIRMED
**Payment Address:** আপনার dashboard এ দেখুন অথবা database query করুন

### Payment 2: order_hj4jwyxoyfcvvvv5
**Amount:** 0.1 USDT
**Status:** CONFIRMED
**Payment Address:** আপনার dashboard এ দেখুন অথবা database query করুন

---

## 🔍 Method 1: Dashboard থেকে Address দেখুন

1. Dashboard open করুন: `http://localhost:3001`
2. **Payments** tab click করুন
3. যে payment check করতে চান সেটা click করুন
4. **ADDRESS** column এ full address দেখবেন

---

## 🔍 Method 2: Database Query করুন

PowerShell অথবা CMD open করে run করুন:

```cmd
cd e:\pepti-hub\payment-gateway\packages\api
npx prisma studio
```

এটা একটা browser window open করবে যেখানে আপনি:
1. **payment_orders** table click করুন
2. **CONFIRMED** status filter করুন
3. **paymentAddress** column এ addresses দেখবেন
4. **amount** column এ amounts দেখবেন

---

## 🔍 Method 3: BscScan দিয়ে Balance Check করুন

### Step 1: Payment Address খুঁজুন

Dashboard থেকে অথবা Prisma Studio থেকে payment address copy করুন।

### Step 2: BscScan এ Check করুন

```
https://bscscan.com/address/YOUR_PAYMENT_ADDRESS
```

**Example:**
```
https://bscscan.com/address/0xab807bB726e169BF
```

### Step 3: USDT Balance দেখুন

BscScan page এ:
1. **"Token"** dropdown click করুন
2. **"Tether USD (USDT)"** select করুন
3. Balance দেখাবে

---

## 💼 Settlement Wallet (যেখানে টাকা যাবে):

**আপনার Merchant Settlement Wallet:**
```
0x81Ce30A37e04a5398A0749dff7ee41579799bEb3263
```

**Dashboard এ দেখানো আছে:** "Settlement Wallet" section এ

**BscScan Check:**
```
https://bscscan.com/address/0x81Ce30A37e04a5398A0749dff7ee41579799bEb3263
```

---

## 🔄 Payment Flow বুঝুন:

### Current Status: CONFIRMED

```
Customer Wallet
     ↓ (0.1 USDT sent)
Payment Address (Temporary)  ← আপনার টাকা এখানে আছে! 💰
     ↓ (After settlement - automatic)
Settlement Wallet (Your Main Wallet) ← এখানে যাবে!
```

### Settlement কখন হবে?

**Automatic settlement হয় যখন:**
1. ✅ Transaction gets 12 confirmations (Done!)
2. ⏳ System processes settlement (automatic every 30 seconds)
3. ⏳ USDT transfers from payment address to your settlement wallet
4. ⏳ Status updates to SETTLED

---

## 🎯 Quick Check Commands:

### Check All Payment Addresses (API Call):

```bash
curl -X GET http://localhost:3000/api/v1/merchants/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Specific Payment:

```bash
curl -X GET http://localhost:3000/api/v1/payments/YOUR_PAYMENT_ID \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 📊 Dashboard Summary যা দেখাচ্ছে:

```
Total Payments: 12
Total Volume: 0 USDT (কারণ settlement pending)
Success Rate: 16.67%
Avg Amount: 0 USDT
```

**Volume 0 কেন?**
Dashboard "Total Volume" শুধু **SETTLED** payments count করে।
আপনার payments এখনো **CONFIRMED** status এ, **SETTLED** status এ পৌঁছায়নি।

---

## ✅ Settlement Verify করার জন্য:

### Console Watch করুন:

আপনার server console এ দেখবেন:

```
[SettlementService] Processing settlement for payment XXX
[SettlementService] ✅ Transferred 0.0975 USDT to 0x81Ce30A37e04a5398A0749dff7ee41579799bEb3263
[SettlementService] TxHash: 0xabc...
[PaymentService] Payment status updated: SETTLED
```

### তারপর Dashboard Refresh করুন:

Settlement complete হলে দেখবেন:
- Total Volume: 0.2 USDT (updated!)
- Payment status: SETTLED

---

## 🔐 Security Note:

**Payment addresses temporary!** প্রতিটা payment এর জন্য একটা unique address generate হয়।

**Your real money is safe on blockchain!** Settlement হোক বা না হোক, টাকা blockchain এ আছে এবং আপনার control এ।

---

## 🆘 এখনো Balance দেখতে পারছেন না?

### সমস্যা হলে:

1. **Database open করুন:** `npx prisma studio`
2. **payment_orders** table এ যান
3. Status = **CONFIRMED** filter করুন
4. **paymentAddress** copy করুন
5. BscScan এ check করুন: `https://bscscan.com/address/[ADDRESS]`

---

**আপনার 0.2 USDT নিরাপদ আছে!** 🔒🎉
