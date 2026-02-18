# 🚨 QUICK FIX: Mainnet Mode Enable করুন (Bangla)

## ⚠️ বর্তমান সমস্যা:

1. ✅ `.env` file **সঠিক আছে** - mainnet configured
2. ❌ কিন্তু **27টা background servers** চলছে পুরানো **testnet** configuration নিয়ে
3. ❌ আপনার **$2 payment** detect হচ্ছে না কারণ servers wrong network monitor করছে

---

## ✅ Solution (2 Minutes):

### Method 1: Automatic Script (সবচেয়ে সহজ) ⭐

একটা **Windows Command Prompt** খুলুন এবং run করুন:

```cmd
e:\pepti-hub\payment-gateway\restart-clean.bat
```

এই script automatically:
1. ✓ সব Node.js processes kill করবে
2. ✓ 3 seconds wait করবে cleanup এর জন্য
3. ✓ Clean server start করবে mainnet mode এ

---

### Method 2: Manual (যদি script কাজ না করে)

#### Step 1: সব Node Processes বন্ধ করুন

**Option A - Task Manager:**
1. `Ctrl + Shift + Esc` চাপুন
2. **"Details"** tab এ যান
3. সব **"node.exe"** খুঁজুন
4. প্রতিটাতে right-click → **"End task"**

**Option B - PowerShell:**
```powershell
Get-Process node | Stop-Process -Force
```

#### Step 2: Server Start করুন

```cmd
cd e:\pepti-hub\payment-gateway\packages\api
pnpm dev
```

---

## 📊 Success Check - এটা দেখা উচিত:

```
[ProviderService] Initialized: { network: 'mainnet', chainId: 56 }
                                                     ^^^^^^^^^^^^^^^^
                                                     ✓ এটা থাকা লাগবে!
```

**❌ যদি এটা দেখেন:**
```
{ network: 'testnet', chainId: 97 }  ← WRONG!
```
তাহলে server এখনো পুরানো config use করছে। আবার kill করে restart দিন।

---

## 💰 আপনার $2 Payment Detection:

যখন server **mainnet mode এ** properly start হবে, তখন console এ এটা দেখবেন:

```
[TransactionMonitor] 💰 Detected transfer: 1 USDT
  From: 0x73B99F713f33a461ca5A8ECd623C26323B44D3b6
  To: 0x5C1193b9456bc7Ea64Ee66bf109a9f76fea68d24
  Amount: 1
  TxHash: 0x...

[TransactionMonitor] ✅ Transaction confirmed (12/12 blocks)
[PaymentService] Payment status updated: CONFIRMED
[SettlementService] ✅ Settlement initiated
[SettlementService] ✅ 0.98 USDT transferred to merchant wallet
```

---

## 🔍 Verify Your Payment:

**BscScan Check:**
```
https://bscscan.com/address/0x5C1193b9456bc7Ea64Ee66bf109a9f76fea68d24
```

যদি আপনি USDT পাঠিয়ে থাকেন, এই address এ transaction দেখাবে।

---

## 🆘 এখনো সমস্যা?

### Check 1: .env file আবার verify করুন

```cmd
notepad e:\pepti-hub\payment-gateway\packages\api\.env
```

এটা আছে কিনা check করুন:
```env
BLOCKCHAIN_NETWORK=mainnet
```

### Check 2: Port 3000 কি already use হচ্ছে?

যদি এই error আসে:
```
Error: listen EADDRINUSE: address already in use :::3000
```

তাহলে আবার সব node processes kill করুন।

### Check 3: Database running আছে?

PostgreSQL database চালু আছে তো? Check করুন:
```cmd
psql -U postgres -c "SELECT 1"
```

---

## 🎯 Summary Checklist:

- [ ] সব node.exe processes killed
- [ ] Server restarted করা হয়েছে
- [ ] Console এ `chainId: 56` দেখাচ্ছে (NOT 97)
- [ ] No ECONNRESET or timeout errors
- [ ] TransactionMonitor watching payment addresses

---

## 💡 Next Steps After Fix:

1. ✅ Server mainnet mode এ চলবে
2. ✅ আপনার $2 payment automatically detect হবে (যদি আপনি পাঠিয়ে থাকেন)
3. ✅ Future payments real-time detect হবে
4. ✅ Dashboard এ সব payments দেখা যাবে

---

**আপনার টাকা নিরাপদ আছে blockchain এ!** 🔒

এখন শুধু `restart-clean.bat` run করুন এবং server properly start হতে দিন।
