# 📄 .env Files এর ব্যাখ্যা (Bangla)

## ❓ কেন দুইটা .env File আছে?

আপনার project এ **দুইটা `.env` file** আছে:

```
e:\pepti-hub\payment-gateway\.env              ← Root folder (MAIN)
e:\pepti-hub\payment-gateway\packages\api\.env ← API folder (Backup)
```

---

## 🎯 কোনটা Use হয়?

### **Root `.env` File = MAIN Configuration**

যখন আপনি এভাবে server চালান:
```cmd
cd e:\pepti-hub\payment-gateway
pnpm dev
```

তখন **root folder এর `.env` file** use হয়।

### API `.env` File = শুধু API package এর জন্য

যদি শুধু API package run করেন:
```cmd
cd e:\pepti-hub\payment-gateway\packages\api
pnpm dev
```

তখন API folder এর `.env` file use হয়।

---

## ✅ এখন কি Fixed হয়েছে:

### 1. **Root `.env` File** (MAIN)
Location: `e:\pepti-hub\payment-gateway\.env`

**Fixed:**
```env
BLOCKCHAIN_NETWORK=mainnet
MASTER_MNEMONIC=chalk eight market lion spy virtual general you gallery cruel eternal wood
BSC_RPC_URL=https://bsc-dataseed1.binance.org:8545/
BSC_RPC_FALLBACK_URL=https://bsc-dataseed2.binance.org:8545/
```

### 2. **API `.env` File** (Backup)
Location: `e:\pepti-hub\payment-gateway\packages\api\.env`

**Fixed:**
```env
BLOCKCHAIN_NETWORK=mainnet
MASTER_MNEMONIC=chalk eight market lion spy virtual general you gallery cruel eternal wood
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_RPC_FALLBACK_URL=https://bsc-dataseed1.bnbchain.org/
```

---

## 🚀 সঠিক পদ্ধতি Server Run করার:

### Method 1: Root Folder থেকে (Recommended ⭐)

```cmd
cd e:\pepti-hub\payment-gateway
pnpm dev
```

এটা **root `.env`** file use করবে এবং **both API + Dashboard** একসাথে চালাবে।

### Method 2: Clean Restart Script (সবচেয়ে সহজ ⭐⭐⭐)

```cmd
e:\pepti-hub\payment-gateway\restart-clean.bat
```

এই script automatically:
1. ✓ সব Node processes kill করবে
2. ✓ Root folder থেকে server start করবে
3. ✓ Mainnet mode এ চালাবে

---

## 🔍 Verify Configuration:

Server start করার পর console এ এটা দেখা উচিত:

```
[ProviderService] Initialized: { network: 'mainnet', chainId: 56 }
                                                     ^^^^^^^^^^^^^^^^
                                                     ✓ এটা থাকা লাগবে!
```

**❌ যদি এটা দেখেন:**
```
{ network: 'testnet', chainId: 97 }  ← WRONG!
```

তাহলে:
1. সব node processes kill করুন
2. Root `.env` file check করুন
3. `restart-clean.bat` দিয়ে server চালান

---

## 📝 Important Files Summary:

| File | Purpose | Use করুন? |
|------|---------|-----------|
| `payment-gateway/.env` | Main configuration | ✅ হ্যাঁ (Root থেকে) |
| `payment-gateway/packages/api/.env` | API-only config | ⚠️ শুধু API run করলে |
| `payment-gateway/restart-clean.bat` | Clean restart script | ✅ হ্যাঁ (সবচেয়ে সহজ) |
| `payment-gateway/QUICK_FIX_MAINNET.md` | Complete troubleshooting guide | ✅ হ্যাঁ |

---

## 🎯 Next Steps:

1. **✓ Done:** দুইটা `.env` file এ mainnet configured
2. **✓ Done:** `MASTER_MNEMONIC` added
3. **✓ Done:** `restart-clean.bat` script ready

### এখন করুন:

```cmd
e:\pepti-hub\payment-gateway\restart-clean.bat
```

---

## 💰 আপনার Payment Detection:

Server properly start হলে, যদি আপনি আগে USDT পাঠিয়ে থাকেন:

```
[TransactionMonitor] 💰 Detected transfer: 1 USDT
  From: 0x73B99F713f33a461ca5A8ECd623C26323B44D3b6
  To: 0x5C1193b9456bc7Ea64Ee66bf109a9f76fea68d24
  Amount: 1
  TxHash: 0x...

[TransactionMonitor] ✅ Transaction confirmed (12/12)
[PaymentService] Payment status: CONFIRMED
[SettlementService] ✅ Settlement successful
```

---

## 🆘 এখনো সমস্যা?

1. Check: `QUICK_FIX_MAINNET.md`
2. Check: `RPC_TIMEOUT_FIX.md`
3. Verify: Task Manager এ কোনো node.exe running নেই
4. Verify: PostgreSQL database চালু আছে

---

**Your money is safe on the blockchain!** 🔒

এখন `restart-clean.bat` run করুন! 🚀
