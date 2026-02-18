# 🚀 Quick Start Guide - PeptiPay Gateway

> Get your crypto payment gateway running in **10 minutes**!

## Prerequisites

- Node.js 20+ and npm/pnpm
- Docker & Docker Compose (recommended)
- Git
- Text editor (VS Code recommended)

## Step 1: Get the Code (30 seconds)

```bash
# Clone repository (when available)
git clone https://github.com/yourusername/payment-gateway.git
cd payment-gateway

# Or start fresh
mkdir payment-gateway && cd payment-gateway
```

## Step 2: Environment Setup (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate master wallet (SAVE THIS SECURELY!)
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Mnemonic:', w.mnemonic.phrase); console.log('Address:', w.address)"
```

**Edit `.env` file:**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/pptpay

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain (Start with testnet!)
NETWORK=testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
MASTER_MNEMONIC="your twelve word mnemonic from above"

# Security (paste generated secrets above)
JWT_SECRET=abc123...
ENCRYPTION_KEY=def456...

# Platform wallet (your address from above)
PLATFORM_HOT_WALLET=0x...

# API
PORT=3000
NODE_ENV=development
```

## Step 3: Start Services (2 minutes)

### Option A: Docker (Easiest)

```bash
# Start all services (Postgres, Redis, API)
docker-compose up -d

# Wait 30 seconds for services to start
sleep 30

# Run database migrations
docker-compose exec gateway npm run migrate

# View logs
docker-compose logs -f gateway
```

### Option B: Local Development

```bash
# Start Postgres and Redis only
docker-compose up -d postgres redis

# Install dependencies
pnpm install

# Run migrations
pnpm migrate

# Start development server
pnpm dev
```

## Step 4: Access Dashboard (1 minute)

```bash
# Open in browser
open http://localhost:3000

# Or use curl to test API
curl http://localhost:3000/api/v1/health
```

**Create your first merchant account:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "businessName": "Test Store"
  }'
```

## Step 5: Create Test Payment (5 minutes)

### Get API Key

1. Login to dashboard: http://localhost:3000/login
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy your key: `ppt_test_abc123...`

### Install SDK

```bash
npm install @pptpay/node-sdk
# or
pnpm add @pptpay/node-sdk
```

### Create Payment

```javascript
// test-payment.js
const PeptiPay = require('@pptpay/node-sdk');

const client = new PeptiPay({
  apiKey: 'ppt_test_abc123...', // Your API key
  apiUrl: 'http://localhost:3000/api/v1',
  network: 'testnet'
});

async function createTestPayment() {
  const payment = await client.payments.create({
    amount: 10,
    currency: 'USDT',
    orderId: 'TEST-' + Date.now()
  });

  console.log('Payment created!');
  console.log('Payment ID:', payment.paymentId);
  console.log('Payment Address:', payment.paymentAddress);
  console.log('Checkout URL:', payment.checkoutUrl);
  console.log('\nOpen this URL in your browser:');
  console.log(payment.checkoutUrl);
}

createTestPayment().catch(console.error);
```

Run it:
```bash
node test-payment.js
```

### Test Payment Flow

1. **Get Test Tokens**:
   - Visit: https://testnet.binance.org/faucet-smart
   - Request test BNB (for gas)
   - Request test BUSD (for payment)

2. **Install MetaMask** (if not already):
   - Chrome: https://metamask.io/download/
   - Add BSC Testnet:
     - Network Name: BSC Testnet
     - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
     - Chain ID: 97
     - Symbol: BNB
     - Explorer: https://testnet.bscscan.com

3. **Complete Payment**:
   - Open the checkout URL from above
   - Click "Pay with MetaMask"
   - Confirm transaction
   - Watch status change from "pending" → "confirmed"

🎉 **Congratulations!** You just processed your first crypto payment!

## Step 6: Set Up Webhooks (Optional)

```javascript
// webhook-server.js
const express = require('express');
const app = express();

app.post('/webhooks/pptpay', express.json(), (req, res) => {
  console.log('Webhook received:', req.body);

  if (req.body.event === 'payment.confirmed') {
    console.log('✅ Payment confirmed!');
    console.log('Order ID:', req.body.orderId);
    console.log('Amount:', req.body.amount, req.body.currency);
    // TODO: Fulfill order here
  }

  res.status(200).send('OK');
});

app.listen(4000, () => {
  console.log('Webhook server running on http://localhost:4000');
});
```

Run webhook server:
```bash
node webhook-server.js
```

Configure webhook in dashboard:
- Settings → Webhooks
- URL: `http://localhost:4000/webhooks/pptpay`
- Save

## Next Steps

### Development
- [ ] Read full [Implementation Plan](docs/04-IMPLEMENTATION-PLAN.md)
- [ ] Explore [Architecture](docs/02-ARCHITECTURE.md) documentation
- [ ] Review [Security Guide](docs/06-SECURITY-GUIDE.md)
- [ ] Customize UI/UX (see [Design Specs](docs/05-UI-UX-DESIGN.md))

### Testing
- [ ] Create 10+ test payments
- [ ] Test different payment scenarios (success, failure, expiration)
- [ ] Test webhook delivery and retries
- [ ] Test mobile wallet integration (Trust Wallet)

### Production Preparation
- [ ] Switch to mainnet configuration
- [ ] Set up production database (managed PostgreSQL)
- [ ] Configure SSL/HTTPS (Let's Encrypt)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Enable 2FA for admin accounts
- [ ] Configure cold wallet for large funds
- [ ] Set up automated backups

### Integration
- [ ] Integrate into your e-commerce platform
- [ ] Add payment widget to checkout page
- [ ] Implement webhook handler in your backend
- [ ] Test end-to-end flow with real customers

## Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
lsof -i :3000  # API port
lsof -i :5432  # Postgres port
lsof -i :6379  # Redis port

# Kill existing processes
kill -9 <PID>

# Restart services
docker-compose restart
```

### Database connection error
```bash
# Check if Postgres is running
docker-compose ps postgres

# View Postgres logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec gateway npm run migrate
```

### Payment not detected
- Check BSC Testnet faucet has funds
- Verify correct network (BSC Testnet, Chain ID: 97)
- Check transaction on BSCScan Testnet
- View gateway logs: `docker-compose logs -f gateway`

### Need help?
- Check [Integration Guide](docs/07-INTEGRATION-GUIDE.md)
- Review [Architecture](docs/02-ARCHITECTURE.md)
- Open GitHub issue
- Join Discord (coming soon)

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# Restart API only
docker-compose restart gateway

# Access database
docker-compose exec postgres psql -U postgres -d pptpay

# Access Redis
docker-compose exec redis redis-cli

# Run tests
pnpm test

# Build production
pnpm build

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/pptpay` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `BSC_RPC_URL` | BSC RPC endpoint | `https://bsc-dataseed.binance.org/` |
| `MASTER_MNEMONIC` | HD wallet mnemonic (12 words) | `word1 word2 ... word12` |
| `JWT_SECRET` | JWT signing secret | `64-character-hex-string` |
| `ENCRYPTION_KEY` | Data encryption key | `64-character-hex-string` |
| `PLATFORM_HOT_WALLET` | Platform fee collection address | `0x...` |
| `NETWORK` | Blockchain network | `testnet` or `mainnet` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |

## What You Just Built

✅ Full cryptocurrency payment gateway
✅ Merchant dashboard for managing payments
✅ Real-time payment tracking
✅ Webhook notifications
✅ BEP20 blockchain integration
✅ Automated fee collection (2.5%)
✅ Secure wallet management

**Total time:** 10 minutes ⚡

**Next:** Start building your first integration! See [Integration Guide](docs/07-INTEGRATION-GUIDE.md)

---

**Questions?** Read the full documentation in the [`docs/`](docs/) folder.

**Ready to ship?** Follow the [Implementation Plan](docs/04-IMPLEMENTATION-PLAN.md) for production deployment.

🚀 **Happy coding!**
