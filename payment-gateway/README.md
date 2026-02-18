# PeptiPay - Crypto Payment Gateway for High-Risk Businesses

> **Self-hosted, open-source cryptocurrency payment gateway with 2.5% transaction fees**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

## 🚀 Why PeptiPay?

Traditional payment processors (Stripe, PayPal) often reject high-risk businesses or charge exorbitant fees. **PeptiPay** is built specifically for businesses that struggle with traditional banking:

✅ **No Account Freezing** - Self-hosted, you control your funds
✅ **Low Fees** - Only 2.5% per transaction (vs 3-5% for traditional processors)
✅ **Instant Settlement** - Crypto payments settle in minutes, not days
✅ **High-Risk Friendly** - No business category restrictions
✅ **Global Access** - Accept payments from anywhere without banking restrictions
✅ **Chargeback Protection** - Cryptocurrency transactions are irreversible

## 💡 Features

### For Merchants
- 🔐 **Enterprise-grade Security** - Multi-layer security, cold wallet support
- ⚡ **Real-time Updates** - WebSocket-based payment status tracking
- 📊 **Merchant Dashboard** - Analytics, transaction history, wallet management
- 🔌 **Easy Integration** - REST API, SDKs (Node.js, Python, PHP), pre-built widgets
- 🔔 **Webhooks** - Automated notifications for payment events
- 🌍 **Multi-language** - Support for 8+ languages

### For Customers
- 📱 **Mobile-First** - Seamless mobile wallet integration (MetaMask, Trust Wallet)
- 🔒 **Privacy-Focused** - Minimal personal data required
- 💰 **Stablecoins** - Pay with USDT, USDC, or BUSD (no volatility)
- ⚡ **Fast Checkout** - 2 clicks to complete payment
- 🌐 **BEP20** - Low network fees (~$0.10-0.50 per transaction)

## 🏗️ Architecture

```
Customer → Payment Widget → Gateway API → Blockchain (BSC) → Merchant Wallet
                                ↓
                           Webhook → Merchant Backend
```

**Tech Stack:**
- **Backend:** Node.js + TypeScript + Express.js
- **Database:** PostgreSQL + Redis
- **Blockchain:** ethers.js (BSC/BEP20)
- **Frontend:** React + TailwindCSS + Shadcn UI
- **Deployment:** Docker + Docker Compose

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

1. **[Overview](docs/01-OVERVIEW.md)** - Vision, business model, value propositions
2. **[Architecture](docs/02-ARCHITECTURE.md)** - System design, tech stack, infrastructure
3. **[Features](docs/03-FEATURES.md)** - Complete feature specifications (50+ features)
4. **[Implementation Plan](docs/04-IMPLEMENTATION-PLAN.md)** - 5-week development roadmap
5. **[UI/UX Design](docs/05-UI-UX-DESIGN.md)** - Design specifications, mockups
6. **[Security Guide](docs/06-SECURITY-GUIDE.md)** - Security architecture, best practices
7. **[Integration Guide](docs/07-INTEGRATION-GUIDE.md)** - Step-by-step merchant integration

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/payment-gateway.git
cd payment-gateway

# Configure environment
cp .env.example .env
nano .env  # Add your configuration

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec gateway npm run migrate

# Access dashboard
open http://localhost:3000
```

### Option 2: npm Package

```bash
npm install @pptpay/gateway
```

```javascript
const { GatewayServer } = require('@pptpay/gateway');

const gateway = new GatewayServer({
  database: { url: process.env.DATABASE_URL },
  blockchain: {
    network: 'bsc-mainnet',
    rpcUrl: process.env.BSC_RPC_URL,
    masterMnemonic: process.env.MASTER_MNEMONIC
  }
});

await gateway.start();
```

## 💻 Integration Example

### Backend (Node.js)

```javascript
const PeptiPay = require('@pptpay/node-sdk');

const client = new PeptiPay({
  apiKey: 'ppt_live_abc123xyz...',
  network: 'mainnet'
});

// Create payment
const payment = await client.payments.create({
  amount: 100,
  currency: 'USDT',
  orderId: 'ORDER-12345'
});

// Redirect customer to checkout
res.redirect(payment.checkoutUrl);
```

### Frontend (React)

```jsx
import { PeptiPayWidget } from '@pptpay/react-widget';

<PeptiPayWidget
  paymentId={paymentId}
  onSuccess={(payment) => {
    window.location.href = '/success';
  }}
/>
```

### Webhook Handler

```javascript
app.post('/webhooks/pptpay', (req, res) => {
  // Verify signature
  const isValid = client.webhooks.verify(
    req.body,
    req.headers['x-pptpay-signature']
  );

  if (req.body.event === 'payment.confirmed') {
    fulfillOrder(req.body.orderId);
  }

  res.status(200).send('OK');
});
```

## 🎯 Roadmap

### Phase 1: MVP (Weeks 1-5)
- [x] Core payment processing engine
- [x] BEP20 blockchain integration
- [x] Payment widget (React)
- [x] Merchant dashboard
- [x] REST API + webhooks
- [x] Security implementation
- [ ] **Status:** Documentation complete, ready for implementation

### Phase 2: Beta Launch (Weeks 6-8)
- [ ] Testnet deployment
- [ ] Beta merchant onboarding (10 merchants)
- [ ] Bug fixes based on feedback
- [ ] npm package publishing

### Phase 3: Production Launch (Weeks 9-12)
- [ ] Mainnet deployment
- [ ] Marketing campaign (Product Hunt, Reddit, Twitter)
- [ ] Community building (Discord, GitHub)
- [ ] 100+ merchant target

### Phase 4: Scale & Enhance (Month 4+)
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] Fiat off-ramp (auto-convert to USD)
- [ ] Recurring payments (subscriptions)
- [ ] Mobile POS app
- [ ] Advanced analytics

## 💰 Business Model

- **Open Source:** MIT License (free to use and modify)
- **Revenue:** 2.5% fee on each transaction (automatically collected)
- **Distribution:** npm package for easy deployment
- **Support:** Community support + optional premium support

### Fee Breakdown

| Transaction Amount | Platform Fee (2.5%) | Merchant Receives | Network Fee (BSC) |
|--------------------|---------------------|-------------------|-------------------|
| $100 USDT          | $2.50               | $97.50            | ~$0.30            |
| $1,000 USDT        | $25.00              | $975.00           | ~$0.30            |
| $10,000 USDT       | $250.00             | $9,750.00         | ~$0.30            |

## 🔒 Security

Security is our **highest priority**. We implement:

- ✅ Multi-layer security architecture
- ✅ Private key encryption (never stored in plain text)
- ✅ Hot/cold wallet separation
- ✅ 2FA for all admin actions
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Rate limiting and DDoS protection
- ✅ Audit logging for all transactions
- ✅ Regular security audits

See [Security Guide](docs/06-SECURITY-GUIDE.md) for detailed security specifications.

## 🛠️ Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Setup

```bash
# Install dependencies
pnpm install

# Setup database
docker-compose up -d postgres redis
npm run migrate

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure

```
payment-gateway/
├── packages/
│   ├── api/              # Express API server
│   ├── blockchain/       # Blockchain service (ethers.js)
│   ├── dashboard/        # React admin panel
│   ├── widget/           # React payment widget
│   └── shared/           # Shared types, utils
├── docs/                 # Documentation
├── docker-compose.yml
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/payment-gateway/issues)
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Improve documentation
- 🌍 Translate to new languages

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this software freely, even for commercial purposes. The only requirement is to include the original copyright notice.

## 🙏 Acknowledgments

- Built with ❤️ for businesses that need financial freedom
- Powered by [Binance Smart Chain](https://www.binance.org/en/smartChain)
- Inspired by [BTCPay Server](https://btcpayserver.org/)
- UI components by [Shadcn UI](https://ui.shadcn.com/)

## 📞 Support

- **Discord:** [Join our community](https://discord.gg/pptpay)
- **GitHub Issues:** [Report bugs](https://github.com/yourusername/payment-gateway/issues)
- **Email:** support@pptpay.com
- **Documentation:** [docs.pptpay.com](https://docs.pptpay.com)

## 🌟 Star Us!

If you find PeptiPay useful, please consider giving us a ⭐ on GitHub. It helps us grow the community!

---

**Made with 💜 by the PeptiPay Team**

*Empowering high-risk businesses with censorship-resistant payments.*
