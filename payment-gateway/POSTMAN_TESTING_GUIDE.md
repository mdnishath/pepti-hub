# 🚀 PeptiPay API - Postman Testing Guide (Bangla)

Ami apnake step-by-step dekhacchi kivabe Postman diye PeptiPay API test korben.

## 📋 Prerequisite

1. **API Server Running:** http://localhost:3000
2. **Postman Installed:** Download from https://www.postman.com/downloads/

---

## 🔥 Step 1: Merchant Registration (নতুন মার্চেন্ট একাউন্ট তৈরি)

### Request Setup:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/merchants/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```

### Body (JSON):
```json
{
  "email": "test@merchant.com",
  "password": "password123",
  "businessName": "My Test Store",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "uuid-here",
      "email": "test@merchant.com",
      "businessName": "My Test Store",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "ppt_abc123..."
  }
}
```

**⚠️ Important:** Response থেকে `token` এবং `apiKey` copy করে রাখুন - পরের steps এ লাগবে।

---

## 🔑 Step 2: Merchant Login (লগইন)

### Request Setup:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/merchants/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```

### Body (JSON):
```json
{
  "email": "test@merchant.com",
  "password": "password123"
}
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "merchant": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "ppt_abc123..."
  }
}
```

---

## 👤 Step 3: Get Merchant Profile (প্রোফাইল দেখা)

### Request Setup:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/merchants/me`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

**Note:** `YOUR_JWT_TOKEN_HERE` এর জায়গায় Step 1/2 এ পাওয়া `token` বসান।

### Expected Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "test@merchant.com",
    "businessName": "My Test Store",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 📊 Step 4: Get Payment Statistics (পেমেন্ট স্ট্যাটিস্টিকস)

### Request Setup:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/merchants/stats`
- **Headers:**
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "totalPayments": 0,
    "totalVolume": "0",
    "successRate": "0",
    "averageAmount": "0",
    "pendingPayments": 0,
    "confirmedPayments": 0,
    "settledPayments": 0
  }
}
```

---

## 💰 Step 5: Create Payment Order (পেমেন্ট তৈরি করা) - MOST IMPORTANT!

### Request Setup:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/payments`
- **Headers:**
  ```
  Content-Type: application/json
  X-API-Key: YOUR_API_KEY_HERE
  ```

**Note:** `YOUR_API_KEY_HERE` এর জায়গায় আপনার API Key (যেটা `ppt_` দিয়ে শুরু হয়) বসান।

### Body (JSON):
```json
{
  "orderId": "order_123456",
  "amount": "100",
  "currency": "USDT",
  "callbackUrl": "https://yourwebsite.com/webhook",
  "returnUrl": "https://yourwebsite.com/success",
  "metadata": {
    "customer_name": "John Doe",
    "product_id": "prod_789"
  }
}
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "id": "payment_uuid",
    "orderId": "order_123456",
    "amount": "100",
    "feeAmount": "2.5",
    "netAmount": "97.5",
    "currency": "USDT",
    "paymentAddress": "0xABC123...",
    "status": "CREATED",
    "expiresAt": "2024-01-01T00:15:00.000Z",
    "qrCode": "data:image/png;base64,iVBORw0KG..."
  }
}
```

**এই response থেকে পাবেন:**
- `paymentAddress`: যেখানে customer টাকা পাঠাবে
- `qrCode`: QR code image (base64)
- `amount`: মোট টাকা
- `feeAmount`: Platform fee (2.5%)
- `netAmount`: আপনি পাবেন

---

## 📜 Step 6: Get Payment History (পেমেন্ট হিস্ট্রি দেখা)

### Request Setup:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/merchants/payments?page=1&limit=10`
- **Headers:**
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "payment_uuid",
        "orderId": "order_123456",
        "amount": "100",
        "currency": "USDT",
        "status": "CREATED",
        "paymentAddress": "0xABC123...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2024-01-01T00:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## 🔄 Step 7: Regenerate API Key (নতুন API Key তৈরি)

### Request Setup:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/merchants/api-key/regenerate`
- **Headers:**
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "apiKey": "ppt_new_key_here..."
  }
}
```

---

## 🛡️ Step 8: Admin Dashboard (Admin Only)

### Request Setup:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/admin/dashboard`
- **Headers:**
  ```
  Authorization: Bearer admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
  ```

### Expected Response:
```json
{
  "merchants": {
    "total": 2,
    "active": 2
  },
  "payments": {
    "total": 5,
    "byStatus": {
      "CREATED": 5
    }
  },
  "volume": {
    "total": "500",
    "platformFees": "12.5"
  },
  "services": {
    "transactionMonitor": {
      "isMonitoring": true
    },
    "webhookWorker": {
      "isRunning": true
    }
  }
}
```

---

## 🎯 Complete Testing Flow (পুরো প্রসেস)

### 1. প্রথমে Register করুন:
```bash
POST /api/v1/merchants/register
```

### 2. Token ও API Key save করুন:
- JWT Token → Merchant dashboard access এর জন্য
- API Key → Payment create করার জন্য

### 3. Payment তৈরি করুন:
```bash
POST /api/v1/payments
Header: X-API-Key: ppt_your_key...
```

### 4. Payment address copy করুন
Response থেকে `paymentAddress` নিন

### 5. QR Code show করুন
Response থেকে `qrCode` (base64 image) নিন এবং আপনার website এ দেখান

### 6. Customer টাকা পাঠাবে
Customer BSC testnet থেকে সেই address এ USDT পাঠাবে

### 7. System automatically:
- ✅ Transaction detect করবে
- ✅ 12 confirmations wait করবে
- ✅ Automatically আপনার wallet এ settle করবে
- ✅ Webhook পাঠাবে (যদি দিয়ে থাকেন)

---

## 🔥 Pro Tips

### Postman Environment Variables Setup:

1. **Create Environment** নামে "PeptiPay Local"
2. **Add Variables:**
   ```
   base_url = http://localhost:3000
   jwt_token = (login করার পর এখানে paste করুন)
   api_key = (login করার পর এখানে paste করুন)
   ```

3. **Use Variables in Requests:**
   - URL: `{{base_url}}/api/v1/merchants/register`
   - Header: `Authorization: Bearer {{jwt_token}}`
   - Header: `X-API-Key: {{api_key}}`

### Quick Test Script:
Postman এর **Tests** tab এ এই script যোগ করুন (auto-save token):

```javascript
// Register/Login এর জন্য
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data.token) {
        pm.environment.set("jwt_token", jsonData.data.token);
    }
    if (jsonData.data.apiKey) {
        pm.environment.set("api_key", jsonData.data.apiKey);
    }
}
```

---

## 📱 Dashboard URL
- **Dashboard:** http://localhost:3001
- **API:** http://localhost:3000

---

## ❓ Common Errors

### 1. **401 Unauthorized**
- Check করুন JWT token ঠিক আছে কিনা
- Token expired হয়ে গেলে আবার login করুন

### 2. **CORS Error**
- Server restart করুন
- Origin http://localhost:3001 allow করা আছে কিনা check করুন

### 3. **Payment Creation Failed**
- API Key ঠিক আছে কিনা verify করুন
- Header এ `X-API-Key` দিয়েছেন কিনা check করুন

---

## ✅ Success Indicators

যদি সব ঠিক থাকে, আপনি দেখবেন:
- ✅ Registration returns token এবং apiKey
- ✅ Login successful
- ✅ Payment creation successful
- ✅ Payment address generate হয়েছে
- ✅ QR code পেয়েছেন

---

**এখন Postman open করুন এবং test শুরু করুন! 🚀**

যদি কোনো সমস্যা হয়, আমাকে বলুন। Happy Testing! 😊
