# 👨‍💼 PeptiPay Admin Panel - Developer Guide (Bangla)

## 🎯 আপনার প্রশ্ন: Developer কিভাবে জানবে সে কি পাচ্ছে?

PeptiPay এ **২টি আলাদা panel** আছে:

### 1️⃣ **Merchant Dashboard** (http://localhost:3001)
- প্রতিটা merchant নিজের payments দেখতে পারে
- শুধু নিজের data দেখা যায়

### 2️⃣ **Admin API** (Platform Owner এর জন্য)
- **সব merchants** এর data দেখা যায়
- **Total revenue**, **platform fees** দেখা যায়
- System health monitor করা যায়

---

## 🔑 Admin API Access (Platform Owner Only)

### Admin API Key:
```
admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

এটা `.env` file এ আছে:
```bash
ADMIN_API_KEY=admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

---

## 📊 Admin API Endpoints (Platform Owner)

### 1. Platform Dashboard

**URL:** `GET http://localhost:3000/api/v1/admin/dashboard`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "merchants": {
    "total": 5,              // মোট কতজন merchant
    "active": 3              // Active merchants
  },
  "payments": {
    "total": 150,            // মোট payment orders
    "byStatus": {
      "CREATED": 10,
      "PENDING": 5,
      "CONFIRMED": 100,
      "SETTLED": 30,
      "EXPIRED": 5
    }
  },
  "volume": {
    "total": "15000",        // মোট transaction volume (USDT)
    "platformFees": "375"    // আপনার প্ল্যাটফর্ম ফি (2.5%)
  },
  "pending": {
    "settlements": 5,        // কতগুলো settlement pending
    "webhooks": 2            // কতগুলো webhook failed
  },
  "services": {
    "transactionMonitor": {
      "isMonitoring": true,
      "activeListeners": 3
    },
    "webhookWorker": {
      "isRunning": true,
      "checkIntervalMs": 30000
    }
  }
}
```

**এই endpoint থেকে আপনি দেখতে পারবেন:**
- ✅ মোট কত টাকা transaction হয়েছে
- ✅ আপনার মোট প্ল্যাটফর্ম ফি কত
- ✅ System ঠিকমত কাজ করছে কিনা
- ✅ কতজন merchant active

---

### 2. All Merchants List

**URL:** `GET http://localhost:3000/api/v1/admin/merchants?page=1&limit=20`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "data": [
    {
      "id": "merchant-uuid",
      "email": "merchant1@example.com",
      "businessName": "Store 1",
      "walletAddress": "0xABC123...",
      "createdAt": "2024-01-01T00:00:00Z",
      "totalPayments": 50,          // এই merchant এর মোট payments
      "totalVolume": "5000",        // এই merchant এর মোট volume
      "totalEarned": "4875"         // Merchant কত টাকা পেয়েছে (after fees)
    },
    {
      "id": "merchant-uuid-2",
      "email": "merchant2@example.com",
      "businessName": "Store 2",
      "walletAddress": "0xDEF456...",
      "createdAt": "2024-01-02T00:00:00Z",
      "totalPayments": 100,
      "totalVolume": "10000",
      "totalEarned": "9750"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**এই endpoint থেকে আপনি দেখতে পারবেন:**
- ✅ কোন merchant কত টাকার transaction করেছে
- ✅ কোন merchant সবচেয়ে বেশি active
- ✅ প্রতিটা merchant এর wallet address

---

### 3. Specific Merchant Details

**URL:** `GET http://localhost:3000/api/v1/admin/merchants/:merchantId`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "id": "merchant-uuid",
  "email": "merchant@example.com",
  "businessName": "My Store",
  "walletAddress": "0xABC123...",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00Z",
  "paymentOrders": [
    // শেষ 10টা payment
  ],
  "_count": {
    "paymentOrders": 50
  }
}
```

---

### 4. All Payments (সব merchants এর)

**URL:** `GET http://localhost:3000/api/v1/admin/payments?page=1&limit=20&status=CONFIRMED`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (optional)
- `merchantId`: Specific merchant (optional)

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "data": [
    {
      "id": "payment-uuid",
      "orderId": "order_123",
      "amount": "100",
      "feeAmount": "2.5",      // আপনার ফি
      "netAmount": "97.5",     // Merchant পাবে
      "currency": "USDT",
      "status": "CONFIRMED",
      "paymentAddress": "0x123...",
      "merchant": {
        "email": "merchant@example.com",
        "businessName": "Store Name"
      },
      "transactions": [
        {
          "txHash": "0xabc...",
          "amount": "100",
          "confirmations": 12
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-01-01T00:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**এই endpoint থেকে আপনি দেখতে পারবেন:**
- ✅ সব payments একসাথে
- ✅ প্রতিটা payment এ কত ফি হয়েছে
- ✅ কোন payment কোন merchant এর

---

### 5. Pending Settlements

**URL:** `GET http://localhost:3000/api/v1/admin/settlements/pending`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "count": 5,
  "data": [
    {
      "id": "payment-uuid",
      "orderId": "order_123",
      "amount": "100",
      "netAmount": "97.5",
      "status": "CONFIRMED",
      "merchant": {
        "email": "merchant@example.com",
        "businessName": "Store",
        "walletAddress": "0xABC..."
      },
      "transactions": [
        {
          "txHash": "0xabc...",
          "confirmations": 12
        }
      ]
    }
  ]
}
```

**এই endpoint থেকে আপনি দেখতে পারবেন:**
- ✅ কোন payments settle হওয়ার জন্য ready
- ✅ কত টাকা transfer হবে

---

### 6. Manual Settlement Trigger

**URL:** `POST http://localhost:3000/api/v1/admin/settlements/process`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "message": "Settlement processing completed",
  "result": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "settlements": [...]
  }
}
```

**কখন use করবেন:**
- Automatic settlement যদি কোনো কারণে fail হয়
- Manually settlement trigger করতে চাইলে

---

### 7. Webhook Statistics

**URL:** `GET http://localhost:3000/api/v1/admin/webhooks/stats`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "pending": 2,          // কতগুলো webhook pending
  "delivered": 145,      // সফলভাবে delivered
  "failed": 3,           // Failed webhooks
  "readyForRetry": 2     // Retry করার জন্য ready
}
```

---

### 8. Failed Webhooks List

**URL:** `GET http://localhost:3000/api/v1/admin/webhooks/failed?page=1&limit=20`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "data": [
    {
      "id": "webhook-uuid",
      "url": "https://merchant-site.com/webhook",
      "event": "payment.confirmed",
      "attempts": 5,
      "status": "FAILED",
      "errorMessage": "Connection timeout",
      "paymentOrder": {
        "orderId": "order_123",
        "merchant": {
          "email": "merchant@example.com",
          "businessName": "Store"
        }
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### 9. Retry Failed Webhooks

**URL:** `POST http://localhost:3000/api/v1/admin/webhooks/retry`

**Headers:**
```
Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

**Response:**
```json
{
  "message": "Webhook retry processing triggered"
}
```

---

## 💰 আপনার Platform Fee কিভাবে Track করবেন?

### Option 1: Dashboard API
```bash
curl -H "Authorization: Bearer ADMIN_KEY" \
  http://localhost:3000/api/v1/admin/dashboard
```

Response থেকে দেখবেন:
```json
{
  "volume": {
    "total": "15000",        // মোট transaction
    "platformFees": "375"    // আপনার fee (2.5% of 15000)
  }
}
```

### Option 2: Database Query
```sql
-- Total platform fees collected
SELECT SUM(feeAmount) as total_fees
FROM payment_orders
WHERE status IN ('CONFIRMED', 'SETTLED');

-- Platform fees by merchant
SELECT
  m.businessName,
  SUM(po.feeAmount) as total_fees,
  COUNT(*) as payment_count
FROM payment_orders po
JOIN merchants m ON po.merchantId = m.id
WHERE po.status IN ('CONFIRMED', 'SETTLED')
GROUP BY m.id
ORDER BY total_fees DESC;
```

---

## 📊 Real-time Monitoring

### Platform Wallet Address:
```
0x7986FBD8BFC645234d5cBc00f89976707AeC6822
```

এই address এ সব **platform fees** জমা হয়।

### Check Balance:
```bash
# Postman/curl দিয়ে
curl "https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x55d398326f99059fF775485246999027B3197955&address=0x7986FBD8BFC645234d5cBc00f89976707AeC6822"
```

---

## 🎯 Complete Testing Flow (Platform Owner)

### 1. Check Platform Dashboard
```bash
curl -H "Authorization: Bearer ADMIN_KEY" \
  http://localhost:3000/api/v1/admin/dashboard
```

### 2. See All Merchants
```bash
curl -H "Authorization: Bearer ADMIN_KEY" \
  "http://localhost:3000/api/v1/admin/merchants?page=1&limit=10"
```

### 3. View All Payments
```bash
curl -H "Authorization: Bearer ADMIN_KEY" \
  "http://localhost:3000/api/v1/admin/payments?page=1&limit=20"
```

### 4. Check Platform Fees
```bash
# Response থেকে প্রতিটা payment এর feeAmount দেখুন
# Example:
{
  "amount": "100",
  "feeAmount": "2.5",    // এটা আপনার
  "netAmount": "97.5"    // এটা merchant এর
}
```

### 5. Monitor Settlement Queue
```bash
curl -H "Authorization: Bearer ADMIN_KEY" \
  http://localhost:3000/api/v1/admin/settlements/pending
```

---

## 📱 Postman Collection Setup

### Create Environment: "PeptiPay Admin"
```
admin_url = http://localhost:3000
admin_key = admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

### Create Folder: "Admin APIs"

Add এই requests:
1. ✅ Platform Dashboard
2. ✅ List Merchants
3. ✅ List Payments
4. ✅ Pending Settlements
5. ✅ Webhook Stats

---

## 🔒 Security Notes

### Admin API Key Protection:
```bash
# .env file এ রাখুন (committed হবে না)
ADMIN_API_KEY=your_secret_key_here

# Production এ:
# - Strong random key generate করুন
# - Environment variable হিসেবে set করুন
# - Never commit to git
```

### Production Recommendation:
```javascript
// Multiple admin users এর জন্য
// Database এ admin table তৈরি করুন
// JWT-based admin authentication implement করুন
```

---

## ✅ Summary - Platform Owner হিসেবে আপনি পাবেন:

### Real-time Data:
- ✅ মোট কত merchants আছে
- ✅ মোট কত টাকার transaction হয়েছে
- ✅ আপনার মোট platform fee কত
- ✅ কোন merchant কত active
- ✅ System health status

### Financial Tracking:
- ✅ প্রতিটা payment এর fee breakdown
- ✅ Platform wallet balance
- ✅ Settlement status
- ✅ Revenue reports

### System Monitoring:
- ✅ Transaction monitor status
- ✅ Webhook delivery status
- ✅ Failed webhooks tracking
- ✅ Settlement queue

**আপনার PeptiPay platform এর সম্পূর্ণ control আপনার হাতে! 🎉**

---

## 🚀 Next Steps

1. **Postman দিয়ে test করুন** - সব admin endpoints
2. **Dashboard data দেখুন** - Real metrics
3. **Database query করুন** - Custom reports
4. **Platform wallet monitor করুন** - Your earnings

Happy Managing! 💰
