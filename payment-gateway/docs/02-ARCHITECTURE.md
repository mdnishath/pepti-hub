# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Merchant's Website                        │
│                     (Your Frontend/Backend)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API / SDK
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PeptiPay Gateway (Self-Hosted)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   API Layer  │  │  Dashboard   │  │  Payment UI Widget │   │
│  │   (Express)  │  │   (React)    │  │      (React)       │   │
│  └──────┬───────┘  └──────────────┘  └──────────┬─────────┘   │
│         │                                        │              │
│  ┌──────▼─────────────────────────────────────────────────┐   │
│  │           Payment Processing Engine (Node.js)          │   │
│  │  • Order Management    • Fee Calculator                │   │
│  │  • Payment Verification • Webhook Manager              │   │
│  │  • Status Tracking     • Rate Limiter                  │   │
│  └──────┬─────────────────────────────────────────────────┘   │
│         │                                                       │
│  ┌──────▼─────────────────────────────────────────────────┐   │
│  │          Blockchain Service Layer (ethers.js)          │   │
│  │  • Smart Contract Interaction                          │   │
│  │  • Transaction Monitoring                              │   │
│  │  • Block Confirmation Tracking                         │   │
│  │  • Gas Price Optimization                              │   │
│  └──────┬─────────────────────────────────────────────────┘   │
│         │                                                       │
│  ┌──────▼─────────────────────────────────────────────────┐   │
│  │              Database Layer (PostgreSQL)                │   │
│  │  • Orders    • Transactions    • Wallet Addresses      │   │
│  │  • Merchants • API Keys        • Audit Logs            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Real-time Layer (Socket.io / Redis)              │ │
│  │  • Payment Status Updates                                │ │
│  │  • Live Transaction Monitoring                           │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Web3 Provider (BSC RPC)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Binance Smart Chain (BEP20)                     │
│  • USDT Contract   • USDC Contract   • BUSD Contract            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. API Layer
**Technology**: Express.js + TypeScript
**Responsibilities**:
- RESTful API endpoints for payment creation, status checks, refunds
- Authentication & authorization (API key management)
- Rate limiting and request validation
- API documentation (Swagger/OpenAPI)

**Key Endpoints**:
```
POST   /api/v1/payments/create      - Create new payment order
GET    /api/v1/payments/:id         - Get payment status
POST   /api/v1/payments/:id/verify  - Manual verification trigger
GET    /api/v1/payments/:id/qr      - Get payment QR code
POST   /api/v1/webhooks/configure   - Set webhook URL
GET    /api/v1/merchant/balance     - Get merchant balance
POST   /api/v1/merchant/withdraw    - Initiate withdrawal
```

### 2. Payment Processing Engine
**Technology**: Node.js + TypeScript
**Responsibilities**:
- Order lifecycle management (created → pending → paid → confirmed)
- Fee calculation (2.5% + network fees)
- Payment expiration handling (default 15 minutes)
- Webhook delivery with retry logic
- Duplicate payment detection
- Currency conversion (optional fiat display)

**Core Workflow**:
```
1. Merchant creates payment → Generate unique wallet address
2. Customer sends crypto → Detect transaction on blockchain
3. Verify amount & token → Calculate fee (2.5%)
4. Wait for confirmations → Update status in real-time
5. Trigger webhook → Notify merchant backend
6. Transfer to merchant wallet → Keep fee in platform wallet
```

### 3. Blockchain Service Layer
**Technology**: ethers.js v6 + Web3.js (fallback)
**Responsibilities**:
- Connect to BSC RPC nodes (primary + fallback)
- Monitor wallet addresses for incoming transactions
- Verify token transfers (ERC20 Transfer events)
- Track block confirmations (default: 12 blocks ≈ 36 seconds)
- Handle chain reorganizations
- Gas price optimization for withdrawals

**Smart Contract Interactions**:
```javascript
// Monitor incoming USDT transfers
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
usdtContract.on("Transfer", (from, to, amount) => {
  if (to === merchantAddress) {
    verifyPayment(from, to, amount);
  }
});
```

### 4. Database Schema (PostgreSQL)

**Tables**:

```sql
-- Merchants table
merchants
  - id (UUID, PK)
  - email (UNIQUE)
  - api_key (UNIQUE, hashed)
  - wallet_address (hot wallet)
  - cold_wallet_address (optional)
  - fee_percentage (default: 2.5)
  - webhook_url
  - webhook_secret
  - status (active, suspended)
  - created_at, updated_at

-- Payment orders
payment_orders
  - id (UUID, PK)
  - merchant_id (FK)
  - order_id (merchant's order reference)
  - amount (decimal, original amount)
  - fee_amount (decimal, 2.5% fee)
  - net_amount (amount - fee_amount)
  - currency (USDT, USDC, BUSD)
  - payment_address (generated BEP20 address)
  - status (created, pending, paid, confirmed, expired, failed)
  - expires_at (timestamp)
  - metadata (JSONB, merchant's custom data)
  - created_at, updated_at

-- Transactions
transactions
  - id (UUID, PK)
  - payment_order_id (FK)
  - tx_hash (blockchain transaction hash)
  - from_address (customer wallet)
  - to_address (payment address)
  - amount (decimal)
  - token_address (contract address)
  - block_number
  - confirmations (integer)
  - status (pending, confirmed, failed)
  - detected_at (timestamp)
  - confirmed_at (timestamp)

-- Webhooks log
webhook_deliveries
  - id (UUID, PK)
  - payment_order_id (FK)
  - url (webhook URL)
  - payload (JSONB)
  - response_status (HTTP status code)
  - response_body (TEXT)
  - attempt (integer, retry count)
  - delivered_at (timestamp)

-- Audit logs
audit_logs
  - id (UUID, PK)
  - merchant_id (FK)
  - action (enum: payment_created, payment_confirmed, withdrawal, etc.)
  - ip_address
  - user_agent
  - metadata (JSONB)
  - created_at
```

### 5. Real-time Layer
**Technology**: Socket.io + Redis (pub/sub)
**Responsibilities**:
- Push payment status updates to frontend
- Live transaction monitoring dashboard
- Multi-instance synchronization (Redis pub/sub)

**Events**:
```javascript
// Client subscribes to payment updates
socket.emit('subscribe', { paymentId: 'abc-123' });

// Server pushes updates
socket.emit('payment:status', {
  paymentId: 'abc-123',
  status: 'pending',
  confirmations: 5,
  txHash: '0x...'
});
```

### 6. Frontend Components

**a) Merchant Dashboard (Admin Panel)**
- Payment history & analytics
- Real-time transaction monitoring
- Withdrawal management
- API key management
- Webhook configuration
- Settlement reports

**b) Payment Widget (Customer-facing)**
- QR code display
- WalletConnect integration
- MetaMask deep linking
- Copy address button
- Real-time payment status
- Mobile-responsive design

## Infrastructure Requirements

### Minimum Server Specs (Self-hosted)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ / Docker support
- **Network**: 100 Mbps connection

### External Dependencies
- **BSC RPC Node**: Public (free) or private (recommended for production)
  - Public: https://bsc-dataseed.binance.org/
  - Private: QuickNode, Ankr, GetBlock ($50-200/month)
- **PostgreSQL**: Self-hosted or managed (AWS RDS, DigitalOcean)
- **Redis**: For session management and pub/sub
- **NGINX**: Reverse proxy for SSL termination

### Deployment Options
1. **Docker Compose**: Easiest for single-server deployment
2. **Kubernetes**: For high-availability production
3. **VPS Providers**: DigitalOcean, Linode, Vultr ($20-50/month)
4. **Cloud**: AWS, GCP, Azure (more expensive but scalable)

## Security Architecture

### Multi-Layer Security

```
Layer 1: Network Security
  ├─ HTTPS/TLS 1.3 only
  ├─ Rate limiting (100 req/min per IP)
  ├─ DDoS protection (Cloudflare)
  └─ Firewall (UFW/iptables)

Layer 2: Application Security
  ├─ API key authentication (SHA-256 hashed)
  ├─ Webhook signature verification (HMAC-SHA256)
  ├─ Input validation & sanitization
  ├─ SQL injection prevention (parameterized queries)
  └─ XSS protection (Content Security Policy)

Layer 3: Blockchain Security
  ├─ Hot wallet (small balance for operations)
  ├─ Cold wallet (majority of funds, offline)
  ├─ Multi-sig withdrawal (optional)
  └─ Transaction amount limits

Layer 4: Data Security
  ├─ Database encryption at rest
  ├─ Sensitive data encryption (AES-256)
  ├─ Private keys stored in HSM/secure enclave
  └─ Regular backups (encrypted)

Layer 5: Monitoring & Auditing
  ├─ Real-time transaction monitoring
  ├─ Anomaly detection (unusual withdrawal patterns)
  ├─ Audit logs for all actions
  └─ Alerting (Telegram/Email/SMS)
```

### Key Security Practices

1. **Private Key Management**:
   - Never store private keys in plain text
   - Use environment variables or secure key vaults
   - Hot wallet: Only for fee collection
   - Cold wallet: For merchant settlements

2. **Wallet Architecture**:
   ```
   Customer pays → Unique payment address (HD wallet derived)
   ↓
   Auto-forward → Merchant hot wallet (after confirmation)
   ↓
   Manual withdrawal → Cold wallet (merchant initiated)
   ↓
   Platform fee (2.5%) → Platform wallet (automated)
   ```

3. **Double-Spend Prevention**:
   - Wait for 12 block confirmations (BSC: ~36 seconds)
   - Monitor for chain reorganizations
   - Flag suspicious transactions (same sender, multiple payments)

4. **API Security**:
   ```javascript
   // API key format: ppt_live_abc123xyz... (32-64 chars)
   // Webhook signature
   const signature = crypto
     .createHmac('sha256', webhook_secret)
     .update(JSON.stringify(payload))
     .digest('hex');
   ```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (scale with load balancer)
- Redis for shared session state
- PostgreSQL read replicas for analytics

### Performance Optimizations
- Database indexing (payment_address, tx_hash, merchant_id)
- Redis caching for exchange rates
- CDN for static assets (dashboard, widget)
- WebSocket connection pooling

### Monitoring
- Prometheus + Grafana for metrics
- Sentry for error tracking
- Custom alerts for failed transactions

## Technology Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js + TypeScript | Async performance, crypto library support |
| API | Express.js | Mature, lightweight, extensive middleware |
| Database | PostgreSQL | ACID compliance, JSON support |
| Cache | Redis | Fast in-memory storage, pub/sub |
| Blockchain | ethers.js v6 | Modern, TypeScript support, BSC compatible |
| Frontend | React + TypeScript | Component reusability, strong typing |
| UI Framework | TailwindCSS + Shadcn | Modern, customizable, fast development |
| Real-time | Socket.io | WebSocket abstraction, auto-reconnect |
| Deployment | Docker + Docker Compose | Easy self-hosting, reproducible |
| Documentation | Swagger/OpenAPI | Interactive API docs |

## Next Steps

This architecture document serves as the blueprint. Next documents will cover:
- Feature specifications (03-FEATURES.md)
- Implementation roadmap (04-IMPLEMENTATION-PLAN.md)
- UI/UX specifications (05-UI-UX-DESIGN.md)
- Security implementation details (06-SECURITY-GUIDE.md)
