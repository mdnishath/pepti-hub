# Implementation Roadmap

## Development Phases Overview

```
Phase 1: Core Backend (Weeks 1-2)
  ├─ Database setup
  ├─ API layer
  ├─ Blockchain service
  └─ Payment processing engine

Phase 2: Frontend & UX (Week 3)
  ├─ Payment widget
  ├─ Merchant dashboard
  └─ Checkout flow

Phase 3: Security & Testing (Week 4)
  ├─ Security hardening
  ├─ Testing (unit, integration, e2e)
  └─ Performance optimization

Phase 4: Documentation & Publishing (Week 5)
  ├─ API documentation
  ├─ Integration guides
  ├─ npm package publishing
  └─ Marketing materials

Phase 5: Launch & Iteration (Ongoing)
  ├─ Beta testing
  ├─ Bug fixes
  └─ Feature enhancements
```

## Phase 1: Core Backend (Weeks 1-2)

### Week 1: Foundation

#### Day 1-2: Project Setup & Database
**Tasks**:
- [ ] Initialize Node.js project with TypeScript
- [ ] Setup project structure (monorepo with pnpm)
- [ ] Configure ESLint, Prettier, Husky (pre-commit hooks)
- [ ] Setup PostgreSQL database (Docker Compose)
- [ ] Create database schema (migrations with Prisma)
- [ ] Setup Redis for caching/pub-sub
- [ ] Environment configuration (.env.example)

**File Structure**:
```
payment-gateway/
├── packages/
│   ├── api/              (Express API server)
│   ├── blockchain/       (Blockchain service)
│   ├── dashboard/        (React admin panel)
│   ├── widget/           (React payment widget)
│   └── shared/           (Shared types, utils)
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

**Database Setup**:
```bash
# Install dependencies
pnpm add -D prisma
pnpm add @prisma/client

# Initialize Prisma
npx prisma init

# Create schema (see 02-ARCHITECTURE.md for table definitions)
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

**Deliverables**:
- ✅ Database schema created with 7 tables
- ✅ Docker Compose with PostgreSQL + Redis
- ✅ TypeScript compilation working
- ✅ Basic API server running (health check endpoint)

---

#### Day 3-4: Blockchain Service Layer
**Tasks**:
- [ ] Install ethers.js v6
- [ ] Configure BSC provider (mainnet + testnet)
- [ ] Implement wallet generation (HD wallet)
- [ ] Create token contract interfaces (ERC20 ABI)
- [ ] Implement transaction monitoring (event listeners)
- [ ] Implement confirmation tracking
- [ ] Add RPC failover logic

**Code Structure**:
```typescript
// packages/blockchain/src/provider.ts
export class BlockchainProvider {
  private provider: ethers.JsonRpcProvider;
  private fallbackProvider: ethers.JsonRpcProvider;

  async getProvider(): Promise<ethers.JsonRpcProvider> {
    // Try primary, fallback to secondary
  }
}

// packages/blockchain/src/wallet.ts
export class WalletService {
  generatePaymentAddress(merchantId: string, orderId: string): string {
    // HD wallet derivation: m/44'/60'/0'/0/{index}
  }
}

// packages/blockchain/src/token.ts
export class TokenService {
  async monitorAddress(address: string, callback: Function) {
    // Listen to Transfer events
  }

  async getBalance(address: string, tokenAddress: string): Promise<BigNumber> {
    // Query ERC20 balanceOf
  }
}
```

**Testing**:
```bash
# Test with BSC Testnet
NETWORK=testnet pnpm test:blockchain

# Test cases:
# 1. Generate 100 unique addresses
# 2. Monitor testnet address for 5 minutes
# 3. Verify USDT transfer detection
# 4. Confirm block confirmation counting
```

**Deliverables**:
- ✅ Wallet generation working (tested 1000+ unique addresses)
- ✅ Event monitoring functional (tested on testnet)
- ✅ Confirmation tracking accurate
- ✅ Failover working (tested by disconnecting primary RPC)

---

#### Day 5-7: API Layer & Payment Engine
**Tasks**:
- [ ] Setup Express.js server with TypeScript
- [ ] Implement API key authentication middleware
- [ ] Create payment creation endpoint
- [ ] Create payment status endpoint
- [ ] Implement payment lifecycle state machine
- [ ] Add fee calculation logic (2.5%)
- [ ] Integrate blockchain service with payment engine
- [ ] Implement QR code generation
- [ ] Add webhook delivery system (with retry)

**API Endpoints**:
```typescript
// packages/api/src/routes/payments.ts
import express from 'express';

const router = express.Router();

// POST /api/v1/payments/create
router.post('/create', authenticate, validatePayment, async (req, res) => {
  const { amount, currency, orderId, metadata } = req.body;

  // 1. Generate payment address
  const paymentAddress = await walletService.generatePaymentAddress(
    req.merchant.id,
    orderId
  );

  // 2. Calculate fees
  const feeAmount = amount * 0.025; // 2.5%
  const netAmount = amount - feeAmount;

  // 3. Create database record
  const payment = await prisma.paymentOrder.create({
    data: {
      merchantId: req.merchant.id,
      orderId,
      amount,
      feeAmount,
      netAmount,
      currency,
      paymentAddress,
      status: 'created',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      metadata
    }
  });

  // 4. Start monitoring blockchain
  await blockchainService.monitorPayment(payment.id, paymentAddress);

  // 5. Generate QR code
  const qrCode = await generateQRCode(paymentAddress, amount, currency);

  res.json({
    paymentId: payment.id,
    paymentAddress,
    amount,
    feeAmount,
    netAmount,
    currency,
    qrCode,
    expiresAt: payment.expiresAt,
    status: 'created'
  });
});

// GET /api/v1/payments/:id
router.get('/:id', authenticate, async (req, res) => {
  const payment = await prisma.paymentOrder.findUnique({
    where: { id: req.params.id },
    include: { transactions: true }
  });

  if (!payment || payment.merchantId !== req.merchant.id) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json(payment);
});
```

**Payment Lifecycle State Machine**:
```typescript
// packages/api/src/services/payment-state-machine.ts
export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  SETTLED = 'settled',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export class PaymentStateMachine {
  async transitionTo(paymentId: string, newStatus: PaymentStatus) {
    const payment = await prisma.paymentOrder.findUnique({
      where: { id: paymentId }
    });

    // Validate state transition
    const validTransitions = {
      created: ['pending', 'expired'],
      pending: ['paid', 'failed'],
      paid: ['confirmed', 'failed'],
      confirmed: ['settled'],
      settled: [],
      expired: [],
      failed: []
    };

    if (!validTransitions[payment.status].includes(newStatus)) {
      throw new Error(`Invalid transition: ${payment.status} → ${newStatus}`);
    }

    // Update database
    await prisma.paymentOrder.update({
      where: { id: paymentId },
      data: { status: newStatus }
    });

    // Trigger side effects (webhooks, notifications)
    await this.handleStatusChange(paymentId, newStatus);
  }

  private async handleStatusChange(paymentId: string, status: PaymentStatus) {
    if (status === 'confirmed') {
      await webhookService.send(paymentId, 'payment.confirmed');
      await emailService.sendConfirmation(paymentId);
    }
  }
}
```

**Webhook System**:
```typescript
// packages/api/src/services/webhook.ts
export class WebhookService {
  async send(paymentId: string, event: string, attempt = 1) {
    const payment = await prisma.paymentOrder.findUnique({
      where: { id: paymentId },
      include: { merchant: true }
    });

    if (!payment.merchant.webhookUrl) return;

    const payload = {
      event,
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      metadata: payment.metadata
    };

    const signature = this.generateSignature(
      payload,
      payment.merchant.webhookSecret
    );

    try {
      const response = await fetch(payment.merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PeptiPay-Signature': signature
        },
        body: JSON.stringify(payload)
      });

      // Log delivery
      await prisma.webhookDelivery.create({
        data: {
          paymentOrderId: paymentId,
          url: payment.merchant.webhookUrl,
          payload,
          responseStatus: response.status,
          responseBody: await response.text(),
          attempt,
          deliveredAt: new Date()
        }
      });

      if (!response.ok && attempt < 5) {
        // Retry with exponential backoff
        setTimeout(() => this.send(paymentId, event, attempt + 1),
          Math.pow(2, attempt) * 1000
        );
      }
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      // Retry logic
    }
  }

  private generateSignature(payload: any, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
```

**Testing**:
```bash
# Integration tests
pnpm test:api

# Test scenarios:
# 1. Create payment → Verify database record
# 2. Send testnet USDT → Verify status changes
# 3. Wait for confirmations → Verify webhook sent
# 4. Test webhook retry logic (mock failed URL)
# 5. Test payment expiration (accelerated timer)
```

**Deliverables**:
- ✅ Payment creation API working
- ✅ Payment status API working
- ✅ Blockchain monitoring integrated
- ✅ Webhook delivery system functional (with retries)
- ✅ QR code generation working
- ✅ Fee calculation accurate

---

### Week 2: Real-time & Completion

#### Day 8-9: Real-time Updates (Socket.io)
**Tasks**:
- [ ] Install Socket.io
- [ ] Setup Redis adapter (for multi-instance)
- [ ] Implement payment status broadcasting
- [ ] Create client SDK for real-time updates
- [ ] Test with multiple concurrent payments

**Implementation**:
```typescript
// packages/api/src/services/realtime.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RealtimeService {
  private io: Server;

  async initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: '*' }
    });

    // Redis adapter for horizontal scaling
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.io.adapter(createAdapter(pubClient, subClient));

    this.io.on('connection', (socket) => {
      socket.on('subscribe', ({ paymentId }) => {
        socket.join(`payment:${paymentId}`);
      });
    });
  }

  broadcastPaymentUpdate(paymentId: string, data: any) {
    this.io.to(`payment:${paymentId}`).emit('payment:status', data);
  }
}
```

**Client Widget Integration**:
```typescript
// packages/widget/src/hooks/usePaymentStatus.ts
import { io } from 'socket.io-client';

export function usePaymentStatus(paymentId: string) {
  const [status, setStatus] = useState('created');

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL);

    socket.emit('subscribe', { paymentId });

    socket.on('payment:status', (data) => {
      setStatus(data.status);
    });

    return () => socket.disconnect();
  }, [paymentId]);

  return status;
}
```

---

#### Day 10-12: Merchant Dashboard Backend
**Tasks**:
- [ ] Implement merchant authentication (JWT)
- [ ] Create merchant registration endpoint
- [ ] Create dashboard API endpoints (stats, transactions)
- [ ] Implement API key generation/management
- [ ] Add withdrawal endpoints
- [ ] Setup email service (SendGrid/AWS SES)

**Dashboard Endpoints**:
```typescript
// GET /api/v1/merchant/stats
{
  today: { revenue: 2450, transactions: 45, successRate: 98.5 },
  week: { revenue: 15300, transactions: 289 },
  month: { revenue: 67800, transactions: 1250 }
}

// GET /api/v1/merchant/transactions?page=1&limit=50
{
  data: [...],
  pagination: { total: 1250, page: 1, pages: 25 }
}

// POST /api/v1/merchant/withdraw
{
  amount: 1000,
  currency: 'USDT',
  toAddress: '0x...',
  twoFactorCode: '123456'
}
```

---

#### Day 13-14: Testing & Refinement
**Tasks**:
- [ ] Unit tests for all services (80%+ coverage)
- [ ] Integration tests for payment flow
- [ ] Load testing (100 concurrent payments)
- [ ] Security audit (basic)
- [ ] Fix bugs identified during testing

**Test Coverage Goals**:
- Blockchain service: 85%
- Payment engine: 90%
- API endpoints: 80%
- Webhook delivery: 85%

**Load Testing**:
```bash
# Using k6
k6 run load-tests/payment-creation.js

# Target: 100 req/s for 5 minutes
# Success criteria:
# - 99% requests < 500ms
# - 0% error rate
# - All webhooks delivered
```

---

## Phase 2: Frontend & UX (Week 3)

### Day 15-17: Payment Widget
**Tasks**:
- [ ] Setup React + TypeScript + Vite
- [ ] Install TailwindCSS + Shadcn UI
- [ ] Create base widget component
- [ ] Implement QR code display
- [ ] Add wallet connection (MetaMask, WalletConnect)
- [ ] Real-time status updates (Socket.io client)
- [ ] Mobile responsiveness
- [ ] Theming (light/dark mode)
- [ ] Internationalization (i18n)

**Widget Components**:
```
PaymentWidget/
├── PaymentHeader       (logo, timer)
├── AmountDisplay       (crypto + fiat)
├── QRCodeDisplay       (QR + copy button)
├── WalletButtons       (MetaMask, WalletConnect)
├── StatusIndicator     (pending, confirmed)
├── TransactionDetails  (hash, confirmations)
└── SuccessScreen       (confetti, receipt)
```

**Key Features**:
- Load time: < 2 seconds
- Mobile-first design
- Accessibility (WCAG 2.1 AA)
- Auto-detect wallet (MetaMask installed?)
- Deep linking for mobile wallets

---

### Day 18-21: Merchant Dashboard
**Tasks**:
- [ ] Setup React admin panel (React + TypeScript)
- [ ] Implement authentication (login, register)
- [ ] Create dashboard layout (sidebar, header)
- [ ] Build overview page (stats, charts)
- [ ] Build transactions page (table, filters)
- [ ] Build wallet management page
- [ ] Build settings page (API keys, webhooks)
- [ ] Add charts (Chart.js or Recharts)
- [ ] Implement table with sorting/filtering

**Dashboard Pages**:
```
/dashboard
├── /overview           (stats, charts, recent transactions)
├── /transactions       (full transaction list)
├── /wallet             (balance, withdrawal)
├── /settings
│   ├── /api-keys
│   ├── /webhooks
│   └── /profile
└── /analytics          (advanced reports)
```

**Tech Stack**:
- React 18 + TypeScript
- TanStack Router (routing)
- TanStack Query (data fetching)
- Zustand (state management)
- TailwindCSS + Shadcn UI
- Recharts (charts)
- React Table (data table)

---

## Phase 3: Security & Testing (Week 4)

### Day 22-24: Security Hardening
**Tasks**:
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add input validation (Zod)
- [ ] Setup CORS properly
- [ ] Implement 2FA (TOTP with speakeasy)
- [ ] Add IP whitelisting for API keys
- [ ] Encrypt sensitive data (AES-256)
- [ ] Setup HTTPS/SSL (Let's Encrypt)
- [ ] Implement CSRF protection
- [ ] Add security headers (Helmet.js)
- [ ] Setup WAF rules (if using Cloudflare)

**Security Checklist**:
- ✅ All API keys hashed in database
- ✅ Private keys never stored in plain text
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (CSP headers)
- ✅ HTTPS enforced
- ✅ Rate limiting active
- ✅ 2FA available
- ✅ Webhook signature verification

---

### Day 25-26: Comprehensive Testing
**Tasks**:
- [ ] End-to-end tests (Playwright)
- [ ] Security testing (OWASP Top 10)
- [ ] Penetration testing (basic)
- [ ] Performance testing (Lighthouse)
- [ ] Cross-browser testing
- [ ] Mobile device testing

**E2E Test Scenarios**:
1. Full payment flow (create → pay → confirm)
2. Merchant registration → API key → first payment
3. Webhook delivery and retry
4. Payment expiration
5. Withdrawal flow with 2FA

---

### Day 27-28: Performance Optimization
**Tasks**:
- [ ] Database query optimization (indexes)
- [ ] API response caching (Redis)
- [ ] Frontend bundle optimization (code splitting)
- [ ] CDN setup for static assets
- [ ] Image optimization (QR codes)
- [ ] Lazy loading components

**Performance Targets**:
- API response: < 200ms (p95)
- Dashboard load: < 2 seconds
- Widget load: < 1.5 seconds
- Payment confirmation: < 60 seconds

---

## Phase 4: Documentation & Publishing (Week 5)

### Day 29-31: Documentation
**Tasks**:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Integration guide (step-by-step)
- [ ] SDK documentation (JSDoc)
- [ ] Deployment guide (Docker, VPS)
- [ ] Troubleshooting guide
- [ ] Video tutorials (optional)

**Documentation Structure**:
```
docs/
├── getting-started.md
├── api-reference.md
├── integration-guide.md
├── webhook-guide.md
├── security-best-practices.md
├── deployment-guide.md
├── troubleshooting.md
└── examples/
    ├── nodejs/
    ├── python/
    ├── php/
    └── nextjs/
```

---

### Day 32-33: npm Package Publishing
**Tasks**:
- [ ] Setup npm organization (@pptpay)
- [ ] Create main package (gateway core)
- [ ] Create SDK packages (node, browser)
- [ ] Create widget package (React component)
- [ ] Write comprehensive README
- [ ] Publish to npm (v1.0.0)
- [ ] Test installation (`npm install @pptpay/gateway`)

**npm Packages**:
```
@pptpay/gateway       (Core backend package)
@pptpay/node-sdk      (Node.js SDK)
@pptpay/react-widget  (React widget component)
@pptpay/js-sdk        (Browser SDK)
```

---

### Day 34-35: Marketing & Launch Prep
**Tasks**:
- [ ] Create landing page (pptpay.com)
- [ ] Write blog post (launch announcement)
- [ ] Create demo video (2-3 minutes)
- [ ] Setup social media (Twitter, Discord)
- [ ] Submit to Product Hunt
- [ ] Post on Reddit (r/cryptocurrency, r/opensource)
- [ ] Reach out to crypto communities

**Marketing Materials**:
- Landing page with demo
- GitHub README with badges
- Demo video (YouTube)
- Twitter thread
- Product Hunt launch
- Dev.to article

---

## Phase 5: Launch & Iteration (Ongoing)

### Week 6-8: Beta Testing
**Goals**:
- Onboard 10 beta merchants
- Process 100+ real transactions
- Gather feedback
- Fix critical bugs

**Beta Testers**:
- High-risk businesses (supplements, CBD, adult content)
- E-commerce stores (Shopify, WooCommerce)
- SaaS businesses
- Content creators (Patreon alternative)

---

### Week 9-12: Feature Enhancements
**Based on Feedback**:
- Additional currencies (Bitcoin, Ethereum)
- More chains (Polygon, Arbitrum)
- Fiat display improvements
- Mobile app (React Native)
- Advanced analytics
- Subscription billing

---

## Development Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Core Backend | 2 weeks | Payment API, blockchain monitoring, webhooks |
| Phase 2: Frontend | 1 week | Payment widget, merchant dashboard |
| Phase 3: Security & Testing | 1 week | Security audit, E2E tests, optimization |
| Phase 4: Docs & Publishing | 1 week | API docs, npm packages, marketing |
| Phase 5: Launch | 4+ weeks | Beta testing, iterations, growth |

**Total MVP Time**: 5 weeks (1 developer working full-time)

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js 20+ LTS
- **Language**: TypeScript 5+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Cache**: Redis 7+
- **Blockchain**: ethers.js v6

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3 + Shadcn UI
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Router**: TanStack Router
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + Loki
- **Testing**: Vitest, Playwright

---

## Resource Requirements

### Team (Ideal)
- 1x Full-stack developer (you)
- 1x Designer (part-time, for UI/UX)
- 1x Security auditor (1-week engagement)

### Budget
- **BSC RPC Node**: $50-200/month (QuickNode/Ankr)
- **Server Hosting**: $20-50/month (DigitalOcean/Linode)
- **Domain**: $10/year
- **Email Service**: $0-50/month (SendGrid free tier)
- **CDN**: $0-20/month (Cloudflare free tier)
- **Total**: ~$100-300/month

### Time Investment
- **Development**: 5 weeks (200 hours)
- **Testing**: 1 week (40 hours)
- **Documentation**: 1 week (40 hours)
- **Total**: 280 hours (~7 weeks full-time)

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| RPC node downtime | Multiple fallback nodes |
| Database failure | Automated backups (daily) |
| High gas fees | Batch transactions, use BSC (cheap) |
| Smart contract bug | Use audited ERC20 contracts only |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Low adoption | Strong marketing, free tier |
| Regulatory issues | Self-hosted (merchant responsibility) |
| Competition | Niche focus (high-risk), better UX |

---

## Success Criteria (3 Months Post-Launch)

✅ 100+ active merchants
✅ $100K+ monthly transaction volume
✅ 99.9% uptime
✅ < 2% support ticket rate
✅ 4.5+ stars on npm
✅ 1000+ GitHub stars
✅ Profitable (fees > infrastructure costs)

---

## Next Steps

After completing this plan:
1. Read [05-UI-UX-DESIGN.md](05-UI-UX-DESIGN.md) for design specs
2. Read [06-SECURITY-GUIDE.md](06-SECURITY-GUIDE.md) for security details
3. Read [07-INTEGRATION-GUIDE.md](07-INTEGRATION-GUIDE.md) for merchant onboarding

Then start coding with Phase 1, Day 1! 🚀
