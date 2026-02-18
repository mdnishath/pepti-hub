# Merchant Integration Guide

## Quick Start (5 Minutes)

### Step 1: Install PeptiPay Gateway
```bash
# Using npm
npm install @pptpay/gateway

# Using Docker (recommended for self-hosting)
git clone https://github.com/pptpay/gateway.git
cd gateway
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

### Step 2: Create Merchant Account
```bash
# Access dashboard
open http://localhost:3000/register

# Or via API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePassword123!",
    "businessName": "My Store"
  }'
```

### Step 3: Get API Key
```bash
# Login to dashboard → Settings → API Keys → Generate New Key
# Copy your API key: ppt_live_abc123xyz...
```

### Step 4: Create Your First Payment
```javascript
const PeptiPay = require('@pptpay/node-sdk');

const client = new PeptiPay({
  apiKey: 'ppt_live_abc123xyz...',
  network: 'mainnet' // or 'testnet' for testing
});

// Create payment
const payment = await client.payments.create({
  amount: 100,
  currency: 'USDT',
  orderId: 'ORDER-12345',
  metadata: {
    customerEmail: 'customer@example.com'
  }
});

console.log('Payment URL:', payment.checkoutUrl);
// Redirect customer to payment.checkoutUrl
```

### Step 5: Handle Webhook
```javascript
const express = require('express');
const app = express();

app.post('/webhooks/pptpay', express.json(), (req, res) => {
  // Verify webhook signature
  const isValid = client.webhooks.verify(
    req.body,
    req.headers['x-pptpay-signature']
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Handle payment confirmation
  if (req.body.event === 'payment.confirmed') {
    const { paymentId, orderId } = req.body;
    fulfillOrder(orderId);
  }

  res.status(200).send('OK');
});
```

**That's it!** You're now accepting crypto payments. 🎉

---

## Detailed Integration

## 1. Installation Options

### Option A: npm Package (For Existing Backend)
Best for: Integrating into existing Node.js application

```bash
npm install @pptpay/gateway @pptpay/node-sdk
```

**Setup**:
```javascript
// server.js
const { GatewayServer } = require('@pptpay/gateway');

const gateway = new GatewayServer({
  database: {
    url: process.env.DATABASE_URL
  },
  redis: {
    url: process.env.REDIS_URL
  },
  blockchain: {
    network: 'bsc-mainnet',
    rpcUrl: process.env.BSC_RPC_URL,
    masterMnemonic: process.env.MASTER_MNEMONIC
  }
});

await gateway.start();
console.log('Gateway running on port 3000');
```

---

### Option B: Docker (Self-Hosted, Recommended)
Best for: Standalone deployment, full control

```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    image: pptpay/gateway:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/pptpay
      REDIS_URL: redis://redis:6379
      BSC_RPC_URL: https://bsc-dataseed.binance.org/
      MASTER_MNEMONIC: ${MASTER_MNEMONIC}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

**Deploy**:
```bash
# 1. Clone repository
git clone https://github.com/pptpay/gateway.git
cd gateway

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Start services
docker-compose up -d

# 4. Run database migrations
docker-compose exec gateway npm run migrate

# 5. Access dashboard
open http://localhost:3000
```

---

### Option C: Cloud Deployment (AWS, DigitalOcean, etc.)
Best for: Production deployment with scalability

**DigitalOcean Example**:
```bash
# 1. Create Droplet (Ubuntu 22.04, $20/month)
doctl compute droplet create pptpay \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3

# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh

# 4. Clone and deploy (same as Docker option)
git clone https://github.com/pptpay/gateway.git
cd gateway
cp .env.example .env
nano .env
docker-compose up -d

# 5. Setup NGINX + SSL (Let's Encrypt)
apt install nginx certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

---

## 2. Configuration

### Environment Variables

```bash
# .env

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pptpay

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain (BSC)
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_RPC_FALLBACK_URL=https://bsc-dataseed1.defibit.io/
MASTER_MNEMONIC="your twelve word mnemonic phrase here"

# Platform Wallets
PLATFORM_HOT_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
PLATFORM_COLD_WALLET=0x... (optional)

# Security
JWT_SECRET=random-64-character-string
ENCRYPTION_KEY=random-64-character-hex-string

# API
PORT=3000
NODE_ENV=production

# Email (optional, for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# Monitoring (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id
```

**Generate Secrets**:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Master Mnemonic (ONE-TIME, save securely!)
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log(w.mnemonic.phrase)"
```

---

## 3. SDK Usage

### Node.js SDK

**Installation**:
```bash
npm install @pptpay/node-sdk
```

**Initialization**:
```javascript
const PeptiPay = require('@pptpay/node-sdk');

const client = new PeptiPay({
  apiKey: process.env.PPTPAY_API_KEY,
  apiUrl: 'https://api.pptpay.com', // Or your self-hosted URL
  network: 'mainnet' // 'mainnet' or 'testnet'
});
```

---

### Creating Payments

**Basic Payment**:
```javascript
const payment = await client.payments.create({
  amount: 100,
  currency: 'USDT',
  orderId: 'ORDER-12345'
});

console.log(payment);
// {
//   paymentId: 'pay_abc123xyz',
//   paymentAddress: '0x742d35Cc...',
//   amount: '100',
//   currency: 'USDT',
//   qrCode: 'data:image/png;base64,...',
//   checkoutUrl: 'https://gateway.pptpay.com/checkout/pay_abc123xyz',
//   expiresAt: '2026-02-17T12:45:00Z',
//   status: 'created'
// }

// Redirect customer to checkoutUrl
res.redirect(payment.checkoutUrl);
```

**Payment with Metadata**:
```javascript
const payment = await client.payments.create({
  amount: 149.99,
  currency: 'USDC',
  orderId: 'ORDER-67890',
  successUrl: 'https://yourstore.com/success',
  cancelUrl: 'https://yourstore.com/cancel',
  metadata: {
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    productIds: ['prod_1', 'prod_2'],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      zip: '10001'
    }
  }
});
```

---

### Checking Payment Status

```javascript
// Get payment details
const payment = await client.payments.get('pay_abc123xyz');

console.log(payment.status);
// 'created', 'pending', 'paid', 'confirmed', 'expired', 'failed'

console.log(payment.confirmations);
// 0-12 (BSC requires 12 confirmations)

if (payment.status === 'confirmed') {
  // Payment successful, fulfill order
  fulfillOrder(payment.orderId);
}
```

---

### Listing Payments

```javascript
// List all payments (paginated)
const payments = await client.payments.list({
  page: 1,
  limit: 50,
  status: 'confirmed', // Optional filter
  currency: 'USDT' // Optional filter
});

console.log(payments);
// {
//   data: [...],
//   pagination: {
//     total: 250,
//     page: 1,
//     pages: 5,
//     limit: 50
//   }
// }
```

---

### Webhook Handling

**Setup Webhook URL**:
```javascript
// Configure webhook (once)
await client.webhooks.configure({
  url: 'https://yourstore.com/webhooks/pptpay',
  events: ['payment.confirmed', 'payment.failed']
});

// Webhook secret will be returned
// Save this secret securely (env variable)
```

**Verify Webhook**:
```javascript
const express = require('express');
const app = express();

app.post('/webhooks/pptpay', express.json(), (req, res) => {
  const signature = req.headers['x-pptpay-signature'];
  const webhookSecret = process.env.PPTPAY_WEBHOOK_SECRET;

  // Verify signature
  const isValid = client.webhooks.verify(
    req.body,
    signature,
    webhookSecret
  );

  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }

  // Handle events
  const { event, paymentId, orderId, amount, status } = req.body;

  switch (event) {
    case 'payment.confirmed':
      console.log(`Payment ${paymentId} confirmed for order ${orderId}`);
      fulfillOrder(orderId);
      break;

    case 'payment.failed':
      console.log(`Payment ${paymentId} failed`);
      notifyCustomer(orderId, 'Payment failed');
      break;

    case 'payment.expired':
      console.log(`Payment ${paymentId} expired`);
      break;
  }

  // Always return 200 OK
  res.status(200).send('OK');
});

app.listen(3000);
```

**Webhook Events**:
- `payment.created`: Payment order created
- `payment.pending`: Transaction detected (0 confirmations)
- `payment.paid`: Transaction included in block (1+ confirmations)
- `payment.confirmed`: Full confirmations reached (12 blocks)
- `payment.failed`: Transaction failed
- `payment.expired`: Payment window expired without payment

---

## 4. Frontend Integration

### React Widget

**Installation**:
```bash
npm install @pptpay/react-widget
```

**Basic Usage**:
```jsx
import { PeptiPayWidget } from '@pptpay/react-widget';
import '@pptpay/react-widget/dist/style.css';

function CheckoutPage() {
  const [paymentId, setPaymentId] = useState(null);

  // Create payment on backend
  useEffect(() => {
    fetch('/api/create-payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        orderId: 'ORDER-123'
      })
    })
      .then(res => res.json())
      .then(data => setPaymentId(data.paymentId));
  }, []);

  if (!paymentId) return <div>Loading...</div>;

  return (
    <PeptiPayWidget
      paymentId={paymentId}
      onSuccess={(payment) => {
        console.log('Payment successful:', payment);
        window.location.href = '/success';
      }}
      onCancel={() => {
        window.location.href = '/cancel';
      }}
      onExpired={() => {
        alert('Payment expired. Please try again.');
      }}
    />
  );
}
```

**Advanced Configuration**:
```jsx
<PeptiPayWidget
  paymentId={paymentId}
  theme="dark" // 'light', 'dark', or 'auto'
  locale="en" // 'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'bn'
  primaryColor="#6366f1"
  merchantLogo="https://yourstore.com/logo.png"
  showWalletButtons={true}
  showQRCode={true}
  showManualAddress={true}
  onSuccess={(payment) => {}}
  onCancel={() => {}}
  onExpired={() => {}}
  onError={(error) => {}}
/>
```

---

### Vanilla JavaScript Widget

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/@pptpay/widget/dist/style.css">
</head>
<body>
  <div id="pptpay-widget"></div>

  <script src="https://unpkg.com/@pptpay/widget/dist/widget.js"></script>
  <script>
    PeptiPay.init({
      containerId: 'pptpay-widget',
      paymentId: 'pay_abc123xyz',
      onSuccess: (payment) => {
        console.log('Payment successful:', payment);
        window.location.href = '/success';
      }
    });
  </script>
</body>
</html>
```

---

## 5. Platform-Specific Integrations

### Shopify

**Step 1: Install App** (coming soon)
```
Shopify Admin → Apps → Visit Shopify App Store → Search "PeptiPay"
```

**Step 2: Configure**
```
Settings → Payments → PeptiPay
- Enter your API key
- Choose currencies (USDT, USDC, BUSD)
- Save
```

**Step 3: Test**
- Create test order
- Select "Pay with Crypto" at checkout
- Complete payment

---

### WooCommerce (WordPress)

**Step 1: Install Plugin**
```bash
# Download plugin
wget https://github.com/pptpay/woocommerce-plugin/releases/latest/download/pptpay.zip

# Upload via WordPress admin
Plugins → Add New → Upload Plugin → Choose File → Install
```

**Step 2: Configure**
```
WooCommerce → Settings → Payments → PeptiPay
- Enable PeptiPay
- API Key: ppt_live_abc123...
- Gateway URL: https://api.pptpay.com (or self-hosted)
- Save changes
```

**Step 3: Test**
- Add product to cart
- Proceed to checkout
- Select "Cryptocurrency (USDT/USDC/BUSD)"
- Complete payment

---

### Custom PHP Integration

```php
<?php
// Install: composer require pptpay/php-sdk

require_once 'vendor/autoload.php';

use PeptiPay\Client;

$client = new Client([
    'apiKey' => getenv('PPTPAY_API_KEY'),
    'apiUrl' => 'https://api.pptpay.com'
]);

// Create payment
$payment = $client->payments->create([
    'amount' => 100,
    'currency' => 'USDT',
    'orderId' => 'ORDER-' . uniqid(),
    'successUrl' => 'https://yourstore.com/success.php',
    'cancelUrl' => 'https://yourstore.com/cancel.php'
]);

// Redirect to checkout
header('Location: ' . $payment['checkoutUrl']);
exit;
?>
```

**Webhook Handler**:
```php
<?php
// webhook.php

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_PPTPAY_SIGNATURE'];
$webhookSecret = getenv('PPTPAY_WEBHOOK_SECRET');

// Verify signature
$computedSignature = hash_hmac('sha256', $payload, $webhookSecret);

if (!hash_equals($signature, $computedSignature)) {
    http_response_code(401);
    die('Invalid signature');
}

$data = json_decode($payload, true);

if ($data['event'] === 'payment.confirmed') {
    $orderId = $data['orderId'];
    fulfillOrder($orderId);
}

http_response_code(200);
echo 'OK';
?>
```

---

### Python Integration

```python
# Install: pip install pptpay

from pptpay import Client

client = Client(
    api_key=os.getenv('PPTPAY_API_KEY'),
    api_url='https://api.pptpay.com'
)

# Create payment
payment = client.payments.create(
    amount=100,
    currency='USDT',
    order_id='ORDER-12345',
    metadata={
        'customer_email': 'customer@example.com'
    }
)

print(f"Payment URL: {payment['checkoutUrl']}")
```

**Flask Webhook**:
```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

@app.route('/webhooks/pptpay', methods=['POST'])
def webhook():
    signature = request.headers.get('X-PeptiPay-Signature')
    webhook_secret = os.getenv('PPTPAY_WEBHOOK_SECRET')

    # Verify signature
    computed_signature = hmac.new(
        webhook_secret.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, computed_signature):
        return jsonify({'error': 'Invalid signature'}), 401

    data = request.json

    if data['event'] == 'payment.confirmed':
        fulfill_order(data['orderId'])

    return jsonify({'status': 'ok'}), 200
```

---

## 6. Testing

### Testnet Setup

**Configure Testnet**:
```javascript
const client = new PeptiPay({
  apiKey: 'ppt_test_abc123xyz...',
  network: 'testnet' // BSC Testnet
});
```

**Get Test Tokens**:
```bash
# Visit BSC Testnet Faucet
open https://testnet.binance.org/faucet-smart

# Request test BNB (for gas)
# Request test USDT/BUSD (for payments)
```

**Create Test Payment**:
```javascript
const payment = await client.payments.create({
  amount: 10, // Test with small amounts
  currency: 'USDT',
  orderId: 'TEST-' + Date.now()
});

console.log('Test payment URL:', payment.checkoutUrl);

// Send testnet USDT to payment.paymentAddress
// Watch status change to 'confirmed' in real-time
```

---

### Local Testing (Without Blockchain)

**Mock Mode**:
```javascript
// For development only
const client = new PeptiPay({
  apiKey: 'ppt_test_abc123xyz...',
  network: 'testnet',
  mockMode: true // Auto-confirm payments after 30 seconds
});

// Payments will auto-confirm without blockchain transactions
```

---

## 7. Production Checklist

Before going live, ensure:

### Infrastructure
- [ ] Self-hosted gateway deployed (or using hosted service)
- [ ] SSL certificate installed (HTTPS)
- [ ] Database backups configured (daily)
- [ ] Monitoring alerts set up (Telegram/email)
- [ ] Rate limiting enabled
- [ ] Firewall configured

### Configuration
- [ ] Using mainnet (not testnet)
- [ ] Master mnemonic securely stored (offline backup)
- [ ] Hot wallet balance limited ($10K max)
- [ ] Cold wallet configured for large funds
- [ ] API keys rotated (no test keys in production)
- [ ] Webhook secret stored securely

### Security
- [ ] 2FA enabled for admin accounts
- [ ] API key IP whitelisting (optional)
- [ ] Webhook signature verification implemented
- [ ] Database encryption at rest
- [ ] Audit logging enabled

### Testing
- [ ] End-to-end payment flow tested
- [ ] Webhook delivery tested
- [ ] Payment expiration tested
- [ ] Refund process tested (if applicable)
- [ ] Mobile payment tested (MetaMask, Trust Wallet)

### Legal & Compliance
- [ ] Terms of Service updated (crypto payments)
- [ ] Privacy policy updated (GDPR)
- [ ] Tax implications reviewed
- [ ] High-risk business compliance checked

---

## 8. Troubleshooting

### Common Issues

**Issue: Payment not detected**
```
Symptoms: Payment status stays "created" after sending crypto

Solutions:
1. Verify correct token contract (USDT, not fake token)
2. Check transaction on BSCScan (should show Transfer event)
3. Verify payment address matches (case-sensitive)
4. Ensure sent to BEP20 address (not ERC20/TRC20)
5. Check RPC node connectivity (gateway logs)
```

**Issue: Webhook not received**
```
Symptoms: Payment confirmed but webhook not triggered

Solutions:
1. Verify webhook URL is publicly accessible (not localhost)
2. Check webhook logs in dashboard (delivery failures)
3. Ensure webhook endpoint returns 200 OK
4. Verify signature validation is correct
5. Check firewall/WAF not blocking requests
```

**Issue: Slow confirmations**
```
Symptoms: Payment takes > 2 minutes to confirm

Solutions:
1. BSC confirmations: ~36 seconds for 12 blocks (normal)
2. If longer: Check RPC node latency
3. Use paid RPC service (QuickNode) for faster detection
4. Verify blockchain not congested (check BSCScan)
```

**Issue: Gateway not starting**
```
Symptoms: Docker container crashes or fails to start

Solutions:
1. Check logs: docker-compose logs gateway
2. Verify environment variables set correctly
3. Ensure database is running: docker-compose ps
4. Check database migrations: npm run migrate
5. Verify master mnemonic format (12 words, space-separated)
```

---

### Support

**Community Support**:
- Discord: https://discord.gg/pptpay
- GitHub Issues: https://github.com/pptpay/gateway/issues
- Documentation: https://docs.pptpay.com

**Premium Support** (optional):
- Email: support@pptpay.com
- Response time: 24 hours
- Priority bug fixes
- Custom integration assistance

---

## 9. Advanced Features

### Refunds

```javascript
// Initiate refund
const refund = await client.payments.refund('pay_abc123xyz', {
  amount: 100, // Full or partial refund
  reason: 'Customer requested refund'
});

console.log(refund);
// {
//   refundId: 'ref_xyz789',
//   status: 'pending',
//   txHash: '0x...' (once processed)
// }

// Note: Refunds require gas fees (paid from hot wallet)
```

---

### Multi-Currency Support

```javascript
// Accept multiple currencies
const payment = await client.payments.create({
  amount: 100,
  acceptedCurrencies: ['USDT', 'USDC', 'BUSD'], // Customer chooses
  orderId: 'ORDER-12345'
});

// Customer can pay with any of the specified currencies
```

---

### Recurring Payments (Future)

```javascript
// Create subscription
const subscription = await client.subscriptions.create({
  amount: 29.99,
  currency: 'USDT',
  interval: 'month', // 'day', 'week', 'month', 'year'
  customerId: 'cust_abc123'
});

// Customer authorizes recurring charge (via smart contract)
// Auto-charge every month
```

---

## 10. Best Practices

### Performance
- Cache exchange rates (5-minute TTL)
- Use Redis for session management
- Enable CDN for static assets
- Compress API responses (gzip)

### Security
- Rotate API keys quarterly
- Enable 2FA for all admin accounts
- Monitor for unusual withdrawal patterns
- Keep software updated (npm update)

### User Experience
- Show clear crypto payment instructions
- Display fiat equivalent (e.g., $100 ≈ 100 USDT)
- Send email confirmations
- Provide customer support for crypto questions

### Business
- Start with testnet, then go live gradually
- Monitor success rate (aim for > 95%)
- Analyze payment flow drop-off points
- A/B test checkout UI for conversions

---

## Conclusion

You're now ready to integrate PeptiPay into your business! 🚀

**Next Steps**:
1. Deploy gateway (Docker recommended)
2. Create test payment on testnet
3. Integrate SDK into your backend
4. Add payment widget to your frontend
5. Configure webhooks
6. Test end-to-end flow
7. Go live on mainnet

**Need help?** Join our Discord or open a GitHub issue.

**Want to contribute?** PeptiPay is open-source (MIT License). Pull requests welcome!

---

## Appendix: API Reference

### Payment Object

```typescript
{
  paymentId: string;          // Unique payment ID
  orderId: string;            // Merchant's order ID
  amount: string;             // Payment amount (decimal)
  feeAmount: string;          // Platform fee (2.5%)
  netAmount: string;          // Amount - fee
  currency: 'USDT' | 'USDC' | 'BUSD';
  paymentAddress: string;     // BEP20 address to send payment
  qrCode: string;             // Data URL of QR code
  checkoutUrl: string;        // URL to payment widget
  status: PaymentStatus;      // Current status
  txHash?: string;            // Blockchain transaction hash
  confirmations: number;      // Block confirmations (0-12)
  expiresAt: string;          // ISO 8601 timestamp
  createdAt: string;
  confirmedAt?: string;
  metadata?: object;          // Merchant's custom data
}
```

### PaymentStatus Enum

```typescript
type PaymentStatus =
  | 'created'      // Payment order created
  | 'pending'      // Transaction detected (0-2 confirmations)
  | 'paid'         // Transaction confirmed (3+ confirmations)
  | 'confirmed'    // Full confirmations (12+ blocks)
  | 'settled'      // Funds transferred to merchant
  | 'expired'      // Payment window expired
  | 'failed';      // Transaction failed
```

### Error Codes

```typescript
400 BAD_REQUEST          // Invalid input
401 UNAUTHORIZED         // Invalid API key
403 FORBIDDEN            // Insufficient permissions
404 NOT_FOUND            // Payment not found
429 TOO_MANY_REQUESTS    // Rate limit exceeded
500 INTERNAL_ERROR       // Server error
503 SERVICE_UNAVAILABLE  // Gateway temporarily down
```

---

**Happy coding!** 💜
