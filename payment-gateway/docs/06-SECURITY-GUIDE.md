# Security Implementation Guide

## Security Overview

As a payment gateway handling cryptocurrency transactions, security is the **highest priority**. This guide covers all security measures implemented to protect merchants, customers, and the platform.

---

## Threat Model

### Potential Threats

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Private key theft | Critical | Medium | Hardware wallet, encryption |
| SQL injection | High | Low | Parameterized queries (Prisma) |
| API key leakage | High | Medium | Hashing, rate limiting |
| DDoS attack | High | High | Cloudflare, rate limiting |
| Man-in-the-middle | High | Low | HTTPS/TLS 1.3 only |
| Phishing attacks | Medium | High | Email verification, 2FA |
| Smart contract exploits | Critical | Low | Use audited contracts only |
| Webhook spoofing | Medium | Medium | HMAC signature verification |
| Database breach | Critical | Low | Encryption at rest, access control |

---

## Layer 1: Infrastructure Security

### 1.1 Network Security

**HTTPS/TLS Configuration**:
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.pptpay.com;

    # TLS 1.3 only (most secure)
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';

    # SSL certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/pptpay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pptpay.com/privkey.pem;

    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Disable server version exposure
    server_tokens off;
}
```

**Firewall Configuration** (UFW):
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp    # SSH (change default port recommended)
sudo ufw allow 80/tcp    # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp   # HTTPS

sudo ufw enable
```

**DDoS Protection**:
- Use Cloudflare (free tier includes DDoS protection)
- Configure rate limiting at CDN level
- Enable "Under Attack Mode" during incidents

---

### 1.2 Server Hardening

**Operating System**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban (brute-force protection)
sudo apt install fail2ban

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl restart fail2ban

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change default SSH port (security by obscurity)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

**Docker Security**:
```yaml
# docker-compose.yml
services:
  api:
    # Run as non-root user
    user: "1000:1000"

    # Read-only root filesystem
    read_only: true

    # Drop all capabilities
    cap_drop:
      - ALL

    # Security options
    security_opt:
      - no-new-privileges:true

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## Layer 2: Application Security

### 2.1 Authentication & Authorization

**API Key Authentication**:
```typescript
// packages/api/src/middleware/authenticate.ts
import crypto from 'crypto';

export async function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Hash the provided key (SHA-256)
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  // Look up merchant by hashed key
  const merchant = await prisma.merchant.findUnique({
    where: { apiKeyHash: hashedKey }
  });

  if (!merchant) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Check if merchant is active
  if (merchant.status !== 'active') {
    return res.status(403).json({ error: 'Account suspended' });
  }

  // Attach merchant to request
  req.merchant = merchant;

  // Log API usage
  await logApiUsage(merchant.id, req.path);

  next();
}

// Generate API key
export function generateApiKey(): string {
  const key = crypto.randomBytes(32).toString('hex');
  return `ppt_live_${key}`;
}

// Hash API key before storing
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
```

**JWT for Dashboard**:
```typescript
// packages/api/src/middleware/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m'; // Short-lived tokens
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export function generateTokens(merchantId: string) {
  const accessToken = jwt.sign(
    { merchantId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { merchantId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

export async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    req.merchantId = decoded.merchantId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

---

### 2.2 Two-Factor Authentication (2FA)

**TOTP Implementation**:
```typescript
// packages/api/src/services/2fa.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorAuth {
  // Generate 2FA secret for merchant
  async enable2FA(merchantId: string) {
    const secret = speakeasy.generateSecret({
      name: `PeptiPay (${merchantId})`,
      issuer: 'PeptiPay'
    });

    // Store secret in database (encrypted)
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        twoFactorSecret: this.encrypt(secret.base32),
        twoFactorEnabled: false // Not enabled until verified
      }
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  }

  // Verify 2FA code
  async verify2FA(merchantId: string, token: string): Promise<boolean> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant.twoFactorSecret) {
      throw new Error('2FA not enabled');
    }

    const secret = this.decrypt(merchant.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) for clock drift
    });

    return verified;
  }

  // Encrypt secret with AES-256
  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
      crypto.randomBytes(16)
    );
    // ... encryption logic
  }

  // Decrypt secret
  private decrypt(encrypted: string): string {
    // ... decryption logic
  }
}
```

**2FA Middleware**:
```typescript
export async function require2FA(req, res, next) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: req.merchantId }
  });

  if (merchant.twoFactorEnabled) {
    const token = req.headers['x-2fa-token'];

    if (!token) {
      return res.status(403).json({
        error: '2FA required',
        requires2FA: true
      });
    }

    const valid = await twoFactorAuth.verify2FA(req.merchantId, token);

    if (!valid) {
      return res.status(403).json({ error: 'Invalid 2FA code' });
    }
  }

  next();
}
```

---

### 2.3 Input Validation

**Using Zod for Schema Validation**:
```typescript
// packages/api/src/validators/payment.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large')
    .refine(val => val >= 1, 'Minimum payment: $1'),

  currency: z.enum(['USDT', 'USDC', 'BUSD']),

  orderId: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid order ID format'),

  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),

  metadata: z.record(z.any()).optional()
});

// Middleware
export function validatePayment(req, res, next) {
  try {
    const validated = createPaymentSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
}
```

**SQL Injection Prevention**:
```typescript
// Prisma automatically prevents SQL injection with parameterized queries
// SAFE:
const payment = await prisma.paymentOrder.findUnique({
  where: { id: req.params.id }
});

// UNSAFE (never use raw queries with user input):
// await prisma.$queryRaw`SELECT * FROM payments WHERE id = ${req.params.id}`;
```

**XSS Prevention**:
```typescript
// Sanitize HTML input
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: []
  });
}

// Use in API endpoints
router.post('/create', (req, res) => {
  req.body.orderId = sanitizeHtml(req.body.orderId);
  // ... rest of logic
});
```

---

### 2.4 Rate Limiting

**API Rate Limiting**:
```typescript
// packages/api/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Payment creation rate limit (stricter)
export const paymentLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:payment:'
  }),
  windowMs: 60 * 1000,
  max: 10, // 10 payments per minute
  message: 'Payment creation limit exceeded',
  keyGenerator: (req) => req.merchant.id // Per merchant
});

// Login rate limit (prevent brute force)
export const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:login:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

// Apply to routes
app.use('/api', apiLimiter);
app.post('/api/v1/payments/create', paymentLimiter, createPayment);
app.post('/api/v1/auth/login', loginLimiter, login);
```

---

## Layer 3: Blockchain Security

### 3.1 Private Key Management

**NEVER store private keys in database or code!**

**Best Practices**:
```typescript
// packages/blockchain/src/wallet.ts
import { ethers } from 'ethers';

export class WalletManager {
  private masterWallet: ethers.HDNodeWallet;

  constructor() {
    // Load mnemonic from secure source (environment variable, HSM, KMS)
    const mnemonic = process.env.MASTER_MNEMONIC;

    if (!mnemonic) {
      throw new Error('MASTER_MNEMONIC not set');
    }

    // Derive master wallet
    this.masterWallet = ethers.Wallet.fromPhrase(mnemonic);
  }

  // Derive payment address (HD wallet)
  derivePaymentAddress(index: number): string {
    const path = `m/44'/60'/0'/0/${index}`;
    const derivedWallet = this.masterWallet.derivePath(path);
    return derivedWallet.address;
  }

  // Get private key for specific address (only for withdrawals)
  getPrivateKey(index: number): string {
    const path = `m/44'/60'/0'/0/${index}`;
    const derivedWallet = this.masterWallet.derivePath(path);
    return derivedWallet.privateKey;
  }
}

// In production, use AWS KMS or hardware wallet:
// https://aws.amazon.com/kms/
// https://www.ledger.com/enterprise
```

**Environment Variables**:
```bash
# .env (NEVER commit to git!)
MASTER_MNEMONIC="word1 word2 word3 ... word12"
ENCRYPTION_KEY="64-character-hex-string"
PLATFORM_HOT_WALLET="0x..." # Public address only
PLATFORM_COLD_WALLET="0x..." # Public address only
```

**Secure Mnemonic Generation**:
```typescript
// One-time setup script (run locally, never on server)
import { ethers } from 'ethers';

const wallet = ethers.Wallet.createRandom();
console.log('Mnemonic:', wallet.mnemonic.phrase);
console.log('Address:', wallet.address);

// Save mnemonic offline:
// 1. Write on paper (multiple copies)
// 2. Store in hardware wallet
// 3. Use password manager (encrypted)
// 4. Metal backup (fireproof)
```

---

### 3.2 Transaction Verification

**Prevent Fake Token Scams**:
```typescript
// packages/blockchain/src/token-validator.ts

// Official token contract addresses (BEP20)
const OFFICIAL_TOKENS = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
};

export async function verifyTransaction(txHash: string) {
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  // 1. Verify transaction succeeded
  if (receipt.status !== 1) {
    throw new Error('Transaction failed');
  }

  // 2. Parse Transfer event
  const transferEvent = receipt.logs.find(log =>
    log.topics[0] === ethers.id('Transfer(address,address,uint256)')
  );

  if (!transferEvent) {
    throw new Error('No Transfer event found');
  }

  // 3. Verify token contract address
  const tokenAddress = transferEvent.address.toLowerCase();
  const isOfficialToken = Object.values(OFFICIAL_TOKENS).some(
    addr => addr.toLowerCase() === tokenAddress
  );

  if (!isOfficialToken) {
    throw new Error('Invalid token contract (possible scam)');
  }

  // 4. Parse transfer details
  const [from, to, amount] = ethers.AbiCoder.defaultAbiCoder().decode(
    ['address', 'address', 'uint256'],
    ethers.concat([transferEvent.topics[1], transferEvent.topics[2], transferEvent.data])
  );

  return {
    from,
    to,
    amount: ethers.formatUnits(amount, 18),
    tokenAddress
  };
}
```

**Monitor for Chain Reorganizations**:
```typescript
export class ChainMonitor {
  async monitorReorgs() {
    let lastBlockNumber = await provider.getBlockNumber();

    provider.on('block', async (blockNumber) => {
      if (blockNumber < lastBlockNumber) {
        console.warn('Chain reorganization detected!');
        await this.handleReorg(lastBlockNumber, blockNumber);
      }
      lastBlockNumber = blockNumber;
    });
  }

  private async handleReorg(oldBlock: number, newBlock: number) {
    // Find payments confirmed in reorged blocks
    const affectedPayments = await prisma.paymentOrder.findMany({
      where: {
        status: 'confirmed',
        transactions: {
          some: {
            blockNumber: {
              gte: newBlock,
              lte: oldBlock
            }
          }
        }
      }
    });

    // Revert status and re-verify
    for (const payment of affectedPayments) {
      await this.reVerifyPayment(payment.id);
    }
  }
}
```

---

### 3.3 Wallet Security

**Hot vs Cold Wallet Architecture**:
```
Customer Payment → Unique Address (HD derived)
                     ↓
           [Wait 12 confirmations]
                     ↓
              Hot Wallet (Automated)
              - Balance: $10K max
              - Purpose: Fee collection, small withdrawals
                     ↓
              Cold Wallet (Manual)
              - Balance: Majority of funds
              - Purpose: Long-term storage
              - Requires manual approval for withdrawals
```

**Automated Hot Wallet Transfer**:
```typescript
export class FundManager {
  async processPayment(paymentId: string) {
    const payment = await prisma.paymentOrder.findUnique({
      where: { id: paymentId }
    });

    // Calculate amounts
    const feeAmount = payment.amount * 0.025; // 2.5%
    const merchantAmount = payment.amount - feeAmount;

    // Transfer fee to platform hot wallet
    await this.transferToHotWallet(
      payment.paymentAddress,
      process.env.PLATFORM_HOT_WALLET,
      feeAmount,
      payment.currency
    );

    // Transfer merchant amount to their wallet
    await this.transferToMerchantWallet(
      payment.paymentAddress,
      payment.merchant.walletAddress,
      merchantAmount,
      payment.currency
    );
  }

  private async transferToHotWallet(from, to, amount, currency) {
    // Use private key from HD wallet
    const wallet = walletManager.getWalletForAddress(from);

    const tokenContract = new ethers.Contract(
      OFFICIAL_TOKENS[currency],
      ERC20_ABI,
      wallet
    );

    const tx = await tokenContract.transfer(
      to,
      ethers.parseUnits(amount.toString(), 18)
    );

    await tx.wait(3); // Wait for 3 confirmations

    // Log transaction
    await logTransfer(from, to, amount, tx.hash);
  }
}
```

**Cold Wallet Manual Withdrawal**:
```typescript
// Only allow cold wallet withdrawals via manual process
router.post('/admin/cold-wallet/withdraw', adminAuth, async (req, res) => {
  const { amount, toAddress, twoFACode } = req.body;

  // 1. Verify admin 2FA
  const valid2FA = await verify2FA(req.admin.id, twoFACode);
  if (!valid2FA) {
    return res.status(403).json({ error: 'Invalid 2FA' });
  }

  // 2. Create withdrawal request (pending approval)
  const withdrawal = await prisma.withdrawal.create({
    data: {
      amount,
      toAddress,
      status: 'pending_approval',
      requestedBy: req.admin.id
    }
  });

  // 3. Send notification to secondary admin for approval
  await notifyAdminForApproval(withdrawal.id);

  res.json({ message: 'Withdrawal request created', id: withdrawal.id });
});
```

---

## Layer 4: Data Security

### 4.1 Database Security

**Encryption at Rest**:
```yaml
# PostgreSQL with encryption
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--data-checksums --encoding=UTF8"
    volumes:
      - pgdata:/var/lib/postgresql/data
    # Encrypt volume
    command: >
      -c ssl=on
      -c ssl_cert_file=/etc/ssl/certs/server.crt
      -c ssl_key_file=/etc/ssl/private/server.key
```

**Sensitive Field Encryption**:
```typescript
// packages/api/src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage:
const encryptedSecret = encrypt(webhookSecret);
await prisma.merchant.update({
  where: { id },
  data: { webhookSecret: encryptedSecret }
});
```

**Database Access Control**:
```sql
-- Create read-only user for analytics
CREATE USER analytics WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE pptpay TO analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics;

-- Restrict admin user to specific IP
ALTER USER admin
  WITH CONNECTION LIMIT 5
  VALID UNTIL '2027-12-31';

-- Enable audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
```

**Automated Backups**:
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="pptpay"

# Dump database
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Encrypt backup
openssl enc -aes-256-cbc -salt \
  -in $BACKUP_DIR/backup_$DATE.sql.gz \
  -out $BACKUP_DIR/backup_$DATE.sql.gz.enc \
  -pass pass:$BACKUP_PASSWORD

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz.enc \
  s3://pptpay-backups/

# Delete old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz.enc" -mtime +30 -delete

# Schedule daily at 2 AM
# crontab: 0 2 * * * /path/to/backup-db.sh
```

---

### 4.2 Webhook Security

**HMAC Signature Verification**:
```typescript
// Merchant verifies webhook authenticity
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Constant-time comparison (prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

// Merchant webhook handler example
app.post('/webhooks/pptpay', (req, res) => {
  const signature = req.headers['x-pptpay-signature'];
  const secret = process.env.PPTPAY_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const { event, paymentId, status } = req.body;

  if (event === 'payment.confirmed') {
    fulfillOrder(paymentId);
  }

  res.status(200).send('OK');
});
```

---

## Layer 5: Monitoring & Incident Response

### 5.1 Security Monitoring

**Audit Logging**:
```typescript
// packages/api/src/services/audit-log.ts
export async function logAuditEvent(
  merchantId: string,
  action: string,
  metadata: any,
  req: Request
) {
  await prisma.auditLog.create({
    data: {
      merchantId,
      action,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata
    }
  });
}

// Usage in critical endpoints
router.post('/merchant/withdraw', async (req, res) => {
  // ... withdrawal logic

  await logAuditEvent(req.merchant.id, 'withdrawal', {
    amount: req.body.amount,
    toAddress: req.body.toAddress
  }, req);
});
```

**Anomaly Detection**:
```typescript
export class AnomalyDetector {
  async detectSuspiciousActivity(merchantId: string) {
    const recentWithdrawals = await prisma.withdrawal.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h
        }
      }
    });

    // Flag: Multiple withdrawals in short period
    if (recentWithdrawals.length > 5) {
      await this.alert('Multiple withdrawals detected', merchantId);
    }

    // Flag: Large withdrawal (> $10K)
    const largeWithdrawal = recentWithdrawals.find(w => w.amount > 10000);
    if (largeWithdrawal) {
      await this.alert('Large withdrawal detected', merchantId);
    }

    // Flag: Withdrawal to new address
    const knownAddresses = await this.getKnownAddresses(merchantId);
    const newAddress = recentWithdrawals.find(
      w => !knownAddresses.includes(w.toAddress)
    );
    if (newAddress) {
      await this.alert('Withdrawal to new address', merchantId);
    }
  }

  private async alert(message: string, merchantId: string) {
    // Send Telegram alert
    await sendTelegramAlert(`🚨 ${message} for merchant ${merchantId}`);

    // Send email to admin
    await sendEmailAlert(message, merchantId);

    // Log to database
    await prisma.securityAlert.create({
      data: { merchantId, message, severity: 'high' }
    });
  }
}
```

**Real-time Alerts** (Telegram Bot):
```typescript
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function sendTelegramAlert(message: string) {
  await bot.sendMessage(ADMIN_CHAT_ID, message, {
    parse_mode: 'Markdown'
  });
}

// Example alerts:
// - New payment > $10K
// - Failed transaction (potential attack)
// - API rate limit exceeded
// - RPC node down
// - Database connection failed
```

---

### 5.2 Incident Response Plan

**Security Incident Playbook**:

1. **Private Key Compromised**:
   - [ ] Immediately freeze all withdrawals
   - [ ] Generate new master wallet
   - [ ] Transfer all funds to new cold wallet
   - [ ] Notify all merchants
   - [ ] Investigate breach source
   - [ ] Update security measures

2. **Database Breach**:
   - [ ] Isolate database server
   - [ ] Revoke all API keys
   - [ ] Force password reset for all merchants
   - [ ] Analyze access logs
   - [ ] Restore from backup if necessary
   - [ ] Notify affected users (GDPR/CCPA)

3. **DDoS Attack**:
   - [ ] Enable Cloudflare "Under Attack Mode"
   - [ ] Increase rate limits temporarily
   - [ ] Block offending IPs
   - [ ] Scale up infrastructure if needed
   - [ ] Monitor for data exfiltration attempts

4. **Smart Contract Exploit**:
   - [ ] Pause all transactions
   - [ ] Verify extent of exploit
   - [ ] Contact affected merchants
   - [ ] Prepare compensation plan
   - [ ] Audit smart contract interactions

---

## Security Checklist (Pre-Launch)

### Infrastructure
- [ ] HTTPS/TLS 1.3 enabled
- [ ] Firewall configured (UFW/iptables)
- [ ] DDoS protection active (Cloudflare)
- [ ] Server hardened (fail2ban, SSH config)
- [ ] Automated backups configured
- [ ] Monitoring alerts set up

### Application
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection headers set
- [ ] CSRF protection enabled
- [ ] 2FA implemented
- [ ] API keys hashed in database
- [ ] Webhook signature verification

### Blockchain
- [ ] Private keys never in database
- [ ] Mnemonic stored securely (offline)
- [ ] Hot wallet balance limited ($10K max)
- [ ] Cold wallet setup for large funds
- [ ] Token contract addresses verified
- [ ] Chain reorg monitoring active
- [ ] Multi-sig for withdrawals (optional)

### Data
- [ ] Database encryption at rest
- [ ] Sensitive fields encrypted (AES-256)
- [ ] Database backups encrypted
- [ ] Access logs enabled
- [ ] Audit logging implemented
- [ ] GDPR compliance reviewed

### Monitoring
- [ ] Security alerts configured
- [ ] Anomaly detection active
- [ ] Telegram bot for alerts
- [ ] Audit logs retained (90 days)
- [ ] Incident response plan documented

---

## Compliance & Legal

### GDPR (EU)
- Right to access: Merchants can export their data
- Right to deletion: Delete account + all data
- Data processing agreements with third parties
- Privacy policy: Clearly state data usage

### AML/KYC (Optional)
- Not required for self-hosted (merchant responsibility)
- Optional: Integrate Chainalysis for transaction screening
- Merchant bears legal responsibility for their payments

### Terms of Service
- Clearly state: Self-hosted, merchant controls funds
- No chargebacks, no refunds (merchant discretion)
- 2.5% fee disclosed upfront
- No warranty, use at own risk (open-source MIT license)

---

## Conclusion

This security guide covers all critical aspects. **Security is an ongoing process**, not a one-time setup. Regular audits, updates, and monitoring are essential.

**Next**: Read [07-INTEGRATION-GUIDE.md](07-INTEGRATION-GUIDE.md) for merchant onboarding instructions.
