# 🛒 Merchant Integration Guide - How Orders & Users Are Tracked

## 🎯 Your Questions Answered:

### 1. Postman দিয়ে transaction করলে Dashboard এ কি দেখা যাবে?
### 2. Balance কোথায় থাকে?
### 3. Real merchant কিভাবে integrate করবে?
### 4. কিভাবে জানবে কোন user payment করেছে?
### 5. Order কিভাবে complete করবে?

---

## 📊 Part 1: Dashboard এ কি দেখা যায়?

যখন আপনি Postman দিয়ে payment create করেন, dashboard এ দেখা যায়:

### Dashboard Stats Page (http://localhost:3001/dashboard):
```
📊 Statistics
├── Total Payments: 5
├── Total Volume: 500 USDT
├── Total Earned: 487.5 USDT (after 2.5% fee)
└── Pending Payments: 2
```

### Payments List Page (http://localhost:3001/payments):
```
Order ID        Amount    Status      Payment Address                 Date
─────────────────────────────────────────────────────────────────────────────
order_001       100 USDT  PENDING     0x123...abc                     2024-01-01
order_002       50 USDT   CONFIRMED   0x456...def                     2024-01-01
order_003       150 USDT  SETTLED     0x789...ghi                     2024-01-02
```

**Click করলে Details দেখা যায়:**
- QR Code (payment address এর)
- Transaction Hash (যদি payment করা হয়ে থাকে)
- Confirmations count
- Webhook delivery status

---

## 💰 Part 2: Balance কোথায় থাকে? (Real vs Test)

### Test Environment (এখন যা চলছে):

#### 1. Payment Wallet (Temporary):
```
Address: 0x123abc... (HD wallet থেকে generate হয়)
Balance: Customer এখানে payment করে
Duration: 15 minutes (তারপর expire)
```

#### 2. Merchant Wallet (Your receiving wallet):
```
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (আপনার wallet)
Balance: Settlement এর পর এখানে আসে (netAmount = amount - 2.5%)
Network: BSC Testnet (Fake USDT)
```

#### 3. Platform Wallet (PeptiPay এর):
```
Address: 0x7986FBD8BFC645234d5cBc00f89976707AeC6822
Balance: Platform fees (2.5%) এখানে জমা হয়
Network: BSC Testnet (Fake USDT)
```

### ⚠️ Test Network - Balance Fake কেন?

```
BSC Testnet USDT = Fake money (testing এর জন্য)
BSC Mainnet USDT = Real money (production)
```

**Testnet এ balance check করতে:**
```
https://testnet.bscscan.com/address/YOUR_WALLET_ADDRESS
```

**Mainnet এ (Real) balance check করতে:**
```
https://bscscan.com/address/YOUR_WALLET_ADDRESS
```

---

## 🔄 Part 3: Transaction Flow - Customer থেকে Merchant পর্যন্ত

```
Customer
   └──> Payment Wallet (0x123...) [Temporary 15min]
           └──> [12 confirmations wait]
                  ├──> Merchant Wallet (97.5 USDT) ✅
                  └──> Platform Wallet (2.5 USDT) ✅
```

### Step-by-Step:

1. **Customer pays**: 100 USDT → Payment Address (0x123abc...)
2. **TransactionMonitor detects**: Blockchain event caught
3. **Status: PENDING**: Waiting for confirmations
4. **12 confirmations reached**: Status → CONFIRMED
5. **SettlementService triggers**:
   - 97.5 USDT → Merchant wallet
   - 2.5 USDT → Platform wallet
6. **Status: SETTLED**: Payment complete
7. **Webhook sent**: Merchant site notified

---

## 🏪 Part 4: Real Store Integration - User Tracking System

### Problem: কিভাবে জানবেন কোন user payment করেছে?

### Solution: Order ID + Callback URL + Session/User ID

---

## 📝 Complete Integration Example

### Scenario:
```
Store: "John's Electronics"
User: "Alice" (alice@email.com)
Cart: iPhone 13 - $500
```

### Step 1: User Checkout করে

**Your store's frontend (React/Next.js):**
```javascript
// checkout.js
async function handleCheckout() {
  const cart = {
    items: [{ name: "iPhone 13", price: 500 }],
    total: 500,
    userId: "user_alice_123",        // Your database user ID
    userEmail: "alice@email.com"
  };

  // Create order in YOUR database first
  const order = await fetch('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({
      userId: cart.userId,
      userEmail: cart.userEmail,
      items: cart.items,
      total: cart.total,
      status: 'PENDING_PAYMENT'
    })
  });

  const orderData = await order.json();
  // orderData.id = "order_alice_500_20240101"

  // Now create PeptiPay payment
  const payment = await fetch('http://localhost:3000/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'ppt_204f0c894959e43cce92acce0aefd9d4417223a78d02f726d83b34c9d388b377'
    },
    body: JSON.stringify({
      orderId: orderData.id,              // ⭐ Your order ID
      amount: "500",
      currency: "USDT",
      returnUrl: `https://yourstore.com/orders/${orderData.id}/success`,
      callbackUrl: `https://yourstore.com/api/webhooks/peptipay`,
      metadata: {                         // ⭐ Custom data
        userId: cart.userId,
        userEmail: cart.userEmail,
        items: JSON.stringify(cart.items)
      }
    })
  });

  const paymentData = await payment.json();

  // Redirect user to payment page
  window.location.href = `/payment/${paymentData.paymentId}`;
}
```

### Step 2: Show Payment Page to User

**Your store's payment page:**
```javascript
// pages/payment/[paymentId].js
export default function PaymentPage({ payment }) {
  return (
    <div>
      <h1>Complete Your Payment</h1>
      <p>Order: {payment.orderId}</p>
      <p>Amount: {payment.amount} USDT</p>

      {/* QR Code */}
      <QRCode value={payment.paymentAddress} />

      {/* Or show address */}
      <div>
        <p>Send {payment.amount} USDT to:</p>
        <code>{payment.paymentAddress}</code>
      </div>

      {/* Status checker */}
      <PaymentStatusChecker paymentId={payment.paymentId} />
    </div>
  );
}
```

### Step 3: User Wallet থেকে Payment করে

```
Alice's Trust Wallet/MetaMask
   └──> Sends 500 USDT
          └──> To: 0x123abc... (payment address)
                 └──> Transaction Hash: 0xabc123def456...
```

### Step 4: PeptiPay Webhook Sends Notification

**PeptiPay automatically calls your webhook URL:**

```http
POST https://yourstore.com/api/webhooks/peptipay
Content-Type: application/json
X-Signature: sha256_signature_here

{
  "event": "payment.confirmed",
  "paymentId": "payment_uuid_123",
  "orderId": "order_alice_500_20240101",    // ⭐ Your order ID
  "amount": "500",
  "currency": "USDT",
  "status": "CONFIRMED",
  "txHash": "0xabc123def456...",
  "confirmations": 12,
  "metadata": {                              // ⭐ Your custom data
    "userId": "user_alice_123",
    "userEmail": "alice@email.com",
    "items": "[{\"name\":\"iPhone 13\",\"price\":500}]"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Step 5: Your Backend Receives Webhook & Completes Order

**Your webhook handler:**
```javascript
// pages/api/webhooks/peptipay.js
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. Verify signature (security)
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.PEPTIPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Extract data
  const { event, orderId, status, metadata } = req.body;

  if (event === 'payment.confirmed') {
    // 3. Update YOUR database
    await db.orders.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentConfirmedAt: new Date(),
        txHash: req.body.txHash
      }
    });

    // 4. Get user info from metadata
    const userId = metadata.userId;
    const userEmail = metadata.userEmail;

    // 5. Send confirmation email to user
    await sendEmail({
      to: userEmail,
      subject: 'Payment Confirmed - Order Processing',
      body: `Your payment for order ${orderId} has been confirmed!`
    });

    // 6. Trigger order fulfillment
    await processOrder(orderId, userId);

    // 7. Notify user (push notification, SMS, etc)
    await sendPushNotification(userId, 'Your order is being processed!');

    console.log(`✅ Order ${orderId} completed for user ${userId}`);
  }

  return res.status(200).json({ received: true });
}

async function processOrder(orderId, userId) {
  // Your business logic:
  // - Create shipping label
  // - Reduce inventory
  // - Assign to warehouse
  // - Update user's order history
  console.log(`Processing order ${orderId} for user ${userId}`);
}
```

---

## 🎯 Part 5: Summary - কিভাবে User Track করা হয়?

### Method 1: Order ID Mapping (Recommended ⭐)

```javascript
// Your Database
orders table:
├── id: "order_alice_500_20240101"     // This is sent to PeptiPay
├── userId: "user_alice_123"
├── userEmail: "alice@email.com"
├── status: "PAID"
└── peptipayPaymentId: "payment_uuid_123"

// When webhook arrives with orderId
// You query: SELECT * FROM orders WHERE id = orderId
// You get: userId, userEmail, etc.
```

### Method 2: Metadata Field (Extra data ⭐)

```javascript
// When creating payment, send:
{
  orderId: "order_123",
  metadata: {
    userId: "user_alice_123",
    userEmail: "alice@email.com",
    userName: "Alice Johnson",
    cartId: "cart_456",
    // Any custom data you need
  }
}

// PeptiPay stores this metadata
// Sends it back in webhook
// You extract userId from metadata
```

### Method 3: Session/Token Based

```javascript
// Generate unique payment token
const paymentToken = generateToken(); // "token_abc123"

// Store in Redis/Database
await redis.set(paymentToken, JSON.stringify({
  userId: "user_alice_123",
  orderId: "order_123",
  expiresAt: Date.now() + 900000 // 15 min
}));

// Use token in orderId
{
  orderId: paymentToken,
  // ...
}

// When webhook arrives
const session = await redis.get(orderId);
const { userId } = JSON.parse(session);
```

---

## 📋 Part 6: Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Checkout (Your Store)                                   │
│    Alice adds iPhone to cart → Clicks "Checkout"                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Create Order (Your Database)                                 │
│    INSERT INTO orders (userId, items, total, status)            │
│    Returns: order_alice_500_20240101                            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Create PeptiPay Payment (API Call)                           │
│    POST /api/v1/payments                                        │
│    Body: { orderId: "order_alice_500_20240101",                 │
│            metadata: { userId: "user_alice_123" } }             │
│    Returns: { paymentId, paymentAddress, qrCode }               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Show Payment Page (Your Frontend)                            │
│    Display QR code & payment address                            │
│    Alice sees: "Send 500 USDT to 0x123abc..."                   │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Alice Pays from Trust Wallet                                 │
│    Trust Wallet → Send 500 USDT → 0x123abc...                   │
│    Transaction Hash: 0xabc123def456...                          │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. PeptiPay Detects Payment (Blockchain Monitor)                │
│    TransactionMonitor catches Transfer event                    │
│    Status: PENDING → Wait 12 confirmations                      │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. 12 Confirmations Reached                                     │
│    Status: CONFIRMED                                            │
│    SettlementService: Transfer to merchant wallet               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Webhook Sent to Your Store                                   │
│    POST https://yourstore.com/api/webhooks/peptipay             │
│    Body: { event: "payment.confirmed",                          │
│            orderId: "order_alice_500_20240101",                 │
│            metadata: { userId: "user_alice_123" } }             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Your Webhook Handler (Your Backend)                          │
│    - Query database: SELECT * FROM orders                       │
│                      WHERE id = "order_alice_500_20240101"      │
│    - Get userId: "user_alice_123"                               │
│    - Update order status: PAID                                  │
│    - Send email to Alice                                        │
│    - Process order (shipping, inventory, etc)                   │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. Order Complete                                              │
│     Alice receives confirmation email                           │
│     Order status: Processing/Shipped                            │
│     ✅ Transaction complete!                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 Part 7: Testing Your Integration

### Test Payment Flow:

```bash
# 1. Register as merchant
curl -X POST http://localhost:3000/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "store@example.com",
    "password": "Test1234!",
    "businessName": "My Store",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'

# Response: { token, apiKey }

# 2. Create payment with user tracking
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "orderId": "order_alice_500_001",
    "amount": "500",
    "currency": "USDT",
    "returnUrl": "https://mystore.com/success",
    "callbackUrl": "https://mystore.com/webhook",
    "metadata": {
      "userId": "user_alice_123",
      "userEmail": "alice@email.com",
      "userName": "Alice Johnson"
    }
  }'

# Response: { paymentId, paymentAddress, qrCode }

# 3. Simulate payment (testnet)
# Go to https://testnet.bscscan.com/address/PAYMENT_ADDRESS
# Send test USDT

# 4. Check webhook delivery
# Your webhook endpoint will receive POST request
# Extract userId from metadata
# Complete order
```

---

## 🔐 Part 8: Security Best Practices

### 1. Always Verify Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

### 2. Idempotency Check

```javascript
// Prevent duplicate order processing
async function handleWebhook(data) {
  const { orderId, paymentId } = data;

  // Check if already processed
  const existing = await db.processedWebhooks.findUnique({
    where: { paymentId }
  });

  if (existing) {
    return { status: 'already_processed' };
  }

  // Process order
  await processOrder(orderId);

  // Mark as processed
  await db.processedWebhooks.create({
    data: { paymentId, processedAt: new Date() }
  });
}
```

### 3. Validate Order Ownership

```javascript
// Make sure order belongs to the user
async function completeOrder(orderId, userId) {
  const order = await db.orders.findFirst({
    where: {
      id: orderId,
      userId: userId // Verify ownership
    }
  });

  if (!order) {
    throw new Error('Order not found or unauthorized');
  }

  // Process order
}
```

---

## ✅ Part 9: What You See in Dashboard vs What Happens

### In PeptiPay Dashboard:

```
Payments Tab:
┌────────────────────────────────────────────────────────────┐
│ Order ID               Amount    Status      Date          │
├────────────────────────────────────────────────────────────┤
│ order_alice_500_001    500 USDT  CONFIRMED   Jan 01, 2024  │
│ order_bob_300_002      300 USDT  SETTLED     Jan 01, 2024  │
│ order_carol_150_003    150 USDT  PENDING     Jan 02, 2024  │
└────────────────────────────────────────────────────────────┘
```

### In Your Store Dashboard:

```
Orders Tab:
┌────────────────────────────────────────────────────────────┐
│ Order ID             User         Items        Status      │
├────────────────────────────────────────────────────────────┤
│ order_alice_500_001  Alice        iPhone 13    Paid ✅     │
│ order_bob_300_002    Bob          Laptop       Shipped 🚚  │
│ order_carol_150_003  Carol        Headphones   Pending ⏳  │
└────────────────────────────────────────────────────────────┘
```

### Behind the Scenes:

```
PeptiPay Database:
├── payment_orders table
│   └── orderId: "order_alice_500_001"
│       metadata: { userId: "user_alice_123", userEmail: "alice@email.com" }

Your Store Database:
├── orders table
│   └── id: "order_alice_500_001"
│       userId: "user_alice_123"
│       userEmail: "alice@email.com"
│       items: [{ name: "iPhone 13", price: 500 }]
│       status: "PAID"
│       peptipayPaymentId: "payment_uuid_123"

Blockchain:
└── BSC Testnet Transaction: 0xabc123def456...
    From: Alice's wallet (0x789ghi...)
    To: Payment address (0x123abc...)
    Amount: 500 USDT
```

---

## 🎯 Final Summary

### 1. **Dashboard দেখায়**: Payment orders (orderId, amount, status)
### 2. **Balance থাকে**:
   - Test: BSC Testnet (fake)
   - Production: BSC Mainnet (real)
### 3. **User track করা**: orderId + metadata থেকে userId extract
### 4. **Order complete করা**: Webhook → Query database → Process order
### 5. **Security**: Signature verify + Idempotency check

**Your PeptiPay integration is now complete! 🎉**

Need help with real-world deployment? Check `PRODUCTION_DEPLOYMENT.md` (coming soon)
