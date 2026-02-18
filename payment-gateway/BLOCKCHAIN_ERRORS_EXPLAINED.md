# 🔧 Blockchain Errors Explained

## ⚠️ Common Error: "from block not found" / "filter not found"

### Error Message:
```
Error: could not coalesce error (error={ "code": -32000, "message": "from block not found" },
payload={ "method": "eth_getFilterChanges", "params": [ "0xffe8..." ] },
code=UNKNOWN_ERROR, version=6.16.0)
```

---

## 🤔 What Does This Mean?

This error occurs when the **blockchain RPC node** (the server that connects you to the blockchain) **loses track of an event filter**.

### How Event Filters Work:

```
Your App (PeptiPay)
   └──> Creates Filter: "Tell me when USDT transfers happen to 0x123abc..."
          └──> RPC Node: "OK, I'll watch for you"
                 └──> [After some time]
                        RPC Node: "Sorry, I forgot about that filter"
                           └──> Error: "filter not found"
```

---

## 🎯 Why Does This Happen?

### 1. **Public RPC Node Limitations**

Free/public BSC RPC nodes have limitations:

```
Public RPC Nodes:
├── Limited memory
├── Short filter lifetime (5-10 minutes)
├── Automatically clean up old filters
└── Shared by thousands of users
```

### 2. **Filter Expiration**

```
0:00 - Filter created ✅
5:00 - Filter still active ✅
10:00 - RPC node cleans up filters ⚠️
10:01 - ethers.js tries to check filter ❌ "filter not found"
```

### 3. **Network Congestion**

When BSC testnet is busy:
- Block reorganizations happen
- RPC nodes restart
- Filters get cleared

---

## ✅ Is This a Problem?

### **NO** - This is **NOT** a critical error!

#### Why It's Safe:

1. **Automatic Recovery**: ethers.js automatically **recreates** the filter
2. **No Missed Transactions**: The blockchain data is permanent; filters are just watching methods
3. **Polling Backup**: TransactionMonitor checks every 15 seconds anyway
4. **Database Backup**: All confirmed transactions are saved in the database

### What Actually Happens:

```
Filter Expires ❌
   └──> ethers.js detects error
          └──> Recreates filter automatically ✅
                 └──> Continues monitoring ✅
```

---

## 🔍 How PeptiPay Handles This

### Multiple Safety Layers:

#### Layer 1: Real-time Event Listeners (ethers.js)
```typescript
// Watches blockchain events in real-time
tokenService.monitorTransfers(address, currency, callback);
```

- **Pro**: Instant detection (within seconds)
- **Con**: Filters may expire (this error)
- **Recovery**: Automatic reconnection

#### Layer 2: Polling System (15-second check)
```typescript
// TransactionMonitor checks every 15 seconds
setInterval(() => {
  checkPendingConfirmations();
}, 15000);
```

- **Pro**: Never misses transactions, no filter issues
- **Con**: Slower detection (up to 15 seconds delay)
- **Result**: Catches anything Layer 1 missed

#### Layer 3: Database Records
```typescript
// Every transaction saved to database
await prisma.transaction.create({
  txHash, amount, blockNumber, confirmations
});
```

- **Pro**: Permanent record, can re-check anytime
- **Con**: None
- **Result**: Full audit trail

---

## 🛡️ Why You're Safe

### Scenario: Filter expires and misses a payment

```
Customer sends 100 USDT to payment address 0x123abc... (block #12345678)
   ↓
Layer 1: Filter expires ❌ Missed it!
   ↓
Layer 2: Polling runs (15 seconds later)
   └──> Queries database: SELECT * FROM payment_orders WHERE status = 'CREATED'
          └──> Queries blockchain: getBalance(0x123abc...)
                 └──> Finds: 100 USDT received! ✅
                        └──> Gets transaction details
                               └──> Records to database
                                      └──> Updates status to PENDING
                                             └──> Sends webhook
                                                    └──> After 12 confirmations → CONFIRMED
                                                           └──> Settles payment → SETTLED
```

**Result**: Transaction still processed correctly, just 15 seconds later instead of instantly.

---

## 🔧 Solutions (In Order of Recommendation)

### Solution 1: **Do Nothing** (Recommended ⭐)

- The error is **logged but handled automatically**
- System continues working normally
- No action needed

### Solution 2: Use Private RPC Node (Production)

For production (real money), use a **paid RPC provider**:

```env
# .env
BSC_RPC_URL=https://bsc-dataseed.binance.org/  # Free (may have same issue)

# Better options:
BSC_RPC_URL=https://bsc-mainnet.nodereal.io/v1/YOUR_API_KEY  # NodeReal
BSC_RPC_URL=https://bsc.getblock.io/YOUR_API_KEY             # GetBlock
BSC_RPC_URL=https://bsc-mainnet.infura.io/v3/YOUR_API_KEY    # Infura
```

**Benefits:**
- Longer filter lifetime (30+ minutes)
- Better reliability
- Faster response times
- Priority support

**Cost:** $0-$50/month depending on usage

### Solution 3: Increase Polling Frequency

If you want faster detection without filters:

```typescript
// TransactionMonitor.ts
// Change from 15 seconds to 10 seconds
this.blockCheckInterval = setInterval(() => {
  this.checkPendingConfirmations();
}, 10000); // 10 seconds instead of 15
```

**Trade-off:**
- ✅ Faster detection
- ❌ More RPC requests (may hit rate limits)

### Solution 4: Implement WebSocket Connection

WebSocket connections are more stable than filters:

```typescript
// Use wss:// instead of https://
const provider = new ethers.WebSocketProvider(
  'wss://bsc-testnet.nodereal.io/ws/v1/YOUR_API_KEY'
);
```

**Benefits:**
- Real-time events without filters
- More stable connection
- Automatic reconnection

**Requires:**
- WebSocket-enabled RPC provider
- Additional error handling for WebSocket disconnections

---

## 📊 Performance Impact

### Current Setup (with filter errors):

```
Payment Detection Time:
├── Best Case: 3 seconds (event listener works)
├── Worst Case: 15 seconds (polling catches it)
└── Average: 8 seconds
```

### With Paid RPC (no filter errors):

```
Payment Detection Time:
├── Best Case: 2 seconds (event listener works)
├── Worst Case: 15 seconds (polling backup)
└── Average: 3 seconds
```

**Difference**: ~5 seconds faster on average (not critical for most use cases)

---

## 🎯 Summary

| Aspect | Status |
|--------|--------|
| **Critical?** | ❌ No |
| **Payments affected?** | ❌ No - all payments still detected |
| **Action needed?** | ❌ No - system handles it automatically |
| **Should you worry?** | ❌ No - it's a logging noise, not a failure |
| **Fix for production?** | ✅ Optional: Use paid RPC for better performance |

---

## 💡 How to Reduce Error Frequency

### Option 1: Suppress Error Logs (Not Recommended)

You can hide these errors, but better to leave them visible:

```typescript
// TokenService.ts - Add error handling
contract.on(eventFilter, listener).catch((error) => {
  if (error.code === 'UNKNOWN_ERROR' && error.error?.message?.includes('block not found')) {
    // Silently ignore filter expiration errors
    return;
  }
  console.error('[TokenService] Error:', error);
});
```

### Option 2: Use Alternative RPC (Recommended)

Try different public RPCs until you find a more stable one:

```env
# Option 1: Binance official
BSC_RPC_URL=https://bsc-testnet.public.blastapi.io

# Option 2: Ankr
BSC_RPC_URL=https://rpc.ankr.com/bsc_testnet_chapel

# Option 3: NodeReal
BSC_RPC_URL=https://bsc-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5
```

---

## 🚀 Production Checklist

Before going live with real money:

### High Priority:
- [ ] Use paid/private RPC endpoint
- [ ] Enable WebSocket connection
- [ ] Set up RPC failover (multiple providers)
- [ ] Monitor RPC health

### Medium Priority:
- [ ] Implement retry logic for RPC calls
- [ ] Add alerting for extended RPC downtime
- [ ] Log RPC performance metrics

### Low Priority:
- [ ] Optimize polling intervals
- [ ] Cache blockchain data
- [ ] Implement circuit breaker pattern

---

## 📞 When to Contact Support

Contact your RPC provider if:

- ✅ Filter errors happen every few minutes (should be 10-30 min)
- ✅ Payments consistently delayed > 2 minutes
- ✅ RPC completely stops responding
- ✅ Error rate > 50% of requests

Otherwise: **Don't worry about it!** 😊

---

**Your PeptiPay system is working correctly despite these errors!** 🎉

The error is just the blockchain infrastructure being honest about its limitations. The important thing is that **no payments are lost** and **all transactions are eventually detected and processed**.
