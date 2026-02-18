# First Time Setup - PeptiPay Gateway

## ✅ তুমি এই পর্যন্ত এসেছো

Project structure ready আছে। এখন setup করতে হবে।

---

## 📋 Step by Step Instructions

### Step 1: Generate Crypto Secrets (1 minute)

```bash
node generate-secrets.js
```

**Output দেখবে:**
```
JWT_SECRET=abc123def456...
ENCRYPTION_KEY=xyz789...
WEBHOOK_SIGNING_SECRET=secret123...
```

**Action:**
1. সব values copy করো
2. `.env` file খোলো (VS Code or Notepad)
3. Paste করো corresponding lines-এ

---

### Step 2: Install Dependencies (2-3 minutes)

```bash
pnpm install
```

**Wait করো** - এটা download করবে:
- Express, Prisma, ethers.js
- TypeScript, types
- All other packages

**You'll see:**
```
Packages: +250
Progress: resolving, downloading, installing...
Done in 2.5s
```

---

### Step 3: Generate Wallet (30 seconds)

```bash
node generate-wallet.js
```

**Output দেখবে:**
```
MASTER_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
PLATFORM_HOT_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Action:**
1. ⚠️ **VERY IMPORTANT:** এই 12 words কোথাও লিখে রাখো (paper-এ!)
2. Copy করো MASTER_MNEMONIC এবং PLATFORM_HOT_WALLET
3. `.env` file-এ paste করো

**⚠️ Security Warning:**
- এই mnemonic দিয়ে তোমার wallet access করা যায়
- NEVER share এটা কারো সাথে
- NEVER commit to git (.gitignore-এ আছে already)
- Paper backup recommended

---

### Step 4: Verify .env File (1 minute)

`.env` file-এ এই values থাকা উচিত:

```bash
# Database (keep default)
DATABASE_URL=postgresql://postgres:password@localhost:5432/pptpay

# Redis (keep default)
REDIS_URL=redis://localhost:6379

# Blockchain - TESTNET!
NETWORK=testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Generated values (from Step 1)
JWT_SECRET=abc123... (your generated value)
ENCRYPTION_KEY=xyz789... (your generated value)
WEBHOOK_SIGNING_SECRET=secret123... (your generated value)

# Generated wallet (from Step 3)
MASTER_MNEMONIC="word1 word2 ... word12" (your 12 words)
PLATFORM_HOT_WALLET=0x... (your address)

# Rest can stay default for now
PORT=3000
NODE_ENV=development
```

**Save** the file!

---

### Step 5: Start Docker Services (1 minute)

```bash
docker-compose up -d postgres redis
```

**Wait 30 seconds** for services to start.

**Verify:**
```bash
docker-compose ps
```

**Should see:**
```
NAME                STATUS    PORTS
pptpay-postgres     running   0.0.0.0:5432->5432/tcp
pptpay-redis        running   0.0.0.0:6379->6379/tcp
```

---

### Step 6: Setup Database (1 minute)

```bash
cd packages/api
pnpm prisma generate
pnpm prisma migrate dev --name init
```

**You'll see:**
```
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client

Running migration: 20260217_init
✔ Database migration completed
```

---

### Step 7: Start API Server (instant)

```bash
# Go back to root
cd ../..

# Start development server
pnpm dev
```

**You'll see:**
```
╔═══════════════════════════════════════════════════════════╗
║   🚀 PeptiPay Gateway API Server                         ║
║   Environment: development                               ║
║   Port: 3000                                             ║
║   URL: http://localhost:3000                             ║
╚═══════════════════════════════════════════════════════════╝
```

**Server is running!** ✅

---

### Step 8: Test Your Setup (30 seconds)

**Open browser:**
```
http://localhost:3000/health
```

**Should see:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T12:34:56.789Z",
  "uptime": 5.123,
  "version": "1.0.0"
}
```

**Test API root:**
```
http://localhost:3000/api/v1
```

**Should see:**
```json
{
  "message": "PeptiPay Gateway API",
  "version": "1.0.0",
  "documentation": "/api/v1/docs"
}
```

---

## 🎉 SUCCESS!

যদি উপরের সব কাজ করে, তাহলে তুমি successfully setup করেছো:

✅ Project dependencies installed
✅ Security secrets generated
✅ Master wallet created
✅ Docker services running
✅ Database migrated
✅ API server running
✅ Health check working

---

## 🚀 What's Next?

**Day 2 Tasks:**
1. Build blockchain service (wallet generation, transaction monitoring)
2. Implement payment processing engine
3. Test with BSC Testnet

**Start here:** [docs/04-IMPLEMENTATION-PLAN.md](docs/04-IMPLEMENTATION-PLAN.md#day-3-4-blockchain-service-layer)

---

## 🛠️ Useful Commands

```bash
# Start dev server
pnpm dev

# Stop dev server
Ctrl + C

# View Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop Docker services
docker-compose down

# Restart Docker services
docker-compose restart

# Open database GUI
cd packages/api && pnpm prisma studio
# Opens at http://localhost:5555
```

---

## ❌ Troubleshooting

### pnpm not found
```bash
npm install -g pnpm
```

### Docker not running
- Open Docker Desktop
- Wait for it to start
- Try again

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in .env
PORT=3001
```

### Database connection error
```bash
# Reset everything
docker-compose down -v
docker-compose up -d
# Wait 30 seconds
cd packages/api && pnpm prisma migrate dev --name init
```

---

## 📞 Need Help?

- Check [SETUP.md](SETUP.md) for detailed instructions
- Read [STATUS.md](STATUS.md) for current progress
- See [docs/INDEX.md](docs/INDEX.md) for all documentation

---

**Ready to build the blockchain service?** Let's go! 🚀
