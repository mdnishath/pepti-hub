# PeptiPay Gateway - Development Setup

## 🎯 তুমি এখন এখানে আছো (Phase 1, Day 1)

আমরা এইমাত্র তৈরি করেছি:
- ✅ Project structure (monorepo with pnpm workspaces)
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Database schema (Prisma)
- ✅ Basic Express API server
- ✅ TypeScript configuration
- ✅ Environment variables template

## 📋 Prerequisites

তোমার system-এ এগুলো install থাকতে হবে:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Docker** + Docker Compose ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Setup Steps (10 Minutes)

### Step 1: Install Dependencies

```bash
# Project root-এ
pnpm install
```

এটা install করবে সব packages (shared, api) এবং dependencies.

### Step 2: Environment Setup

```bash
# .env file তৈরি করো
cp .env.example .env

# .env file edit করো
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Important values যেগুলো এখনই change করতে হবে:**

```bash
# Database (keep default for local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/pptpay

# Redis (keep default)
REDIS_URL=redis://localhost:6379

# Blockchain - TESTNET দিয়ে শুরু করো!
NETWORK=testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Generate Master Wallet (IMPORTANT - একবারই করবে!)
# Run this command and paste output here:
# node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Mnemonic:', w.mnemonic.phrase, '\nAddress:', w.address)"
MASTER_MNEMONIC="তোমার 12-word mnemonic এখানে পেস্ট করো"
PLATFORM_HOT_WALLET=0x... (তোমার wallet address)

# Generate Security Keys
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=... (64-character hex string)
ENCRYPTION_KEY=... (64-character hex string)
```

**Mnemonic এবং Security Keys generate করার command:**

```bash
# Master Wallet generate করো (একবারই!)
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Mnemonic:', w.mnemonic.phrase, '\nAddress:', w.address)"

# এটা print করবে তোমার mnemonic এবং address
# ⚠️ IMPORTANT: এই mnemonic টা কোথাও safe জায়গায় save করো!
# Never commit to git!

# JWT Secret generate করো
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key generate করো
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Start Docker Services

```bash
# PostgreSQL + Redis start করো
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps

# তোমার দেখতে পাবে:
# pptpay-postgres  running  0.0.0.0:5432->5432/tcp
# pptpay-redis     running  0.0.0.0:6379->6379/tcp
```

### Step 4: Run Database Migrations

```bash
# Prisma generate (TypeScript types তৈরি করবে)
cd packages/api
pnpm prisma generate

# Database migration run করো
pnpm prisma migrate dev --name init

# Success message দেখবে:
# ✔ Database migration completed
```

### Step 5: Start API Server

```bash
# Project root থেকে
pnpm dev

# অথবা
cd packages/api
pnpm dev
```

তুমি দেখবে:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 PeptiPay Gateway API Server                         ║
║                                                           ║
║   Environment: development                               ║
║   Port: 3000                                             ║
║   URL: http://localhost:3000                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 6: Test Your Setup

**Browser-এ খোলো:**
```
http://localhost:3000/health
```

তোমার দেখা উচিত:
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T...",
  "uptime": 5.123,
  "version": "1.0.0"
}
```

**API endpoint test করো:**
```
http://localhost:3000/api/v1
```

**অথবা terminal-এ:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1
```

## ✅ Verification Checklist

- [ ] pnpm install successfully completed
- [ ] .env file created এবং configured
- [ ] Master wallet mnemonic generated এবং saved securely
- [ ] Docker services running (postgres + redis)
- [ ] Database migrations successful
- [ ] API server starting without errors
- [ ] Health check endpoint responding
- [ ] /api/v1 endpoint responding

## 🎉 Success!

যদি সব steps work করে, তাহলে congratulations! 🎉

**তুমি successfully setup করেছো:**
- ✅ Development environment
- ✅ PostgreSQL database with schema
- ✅ Redis cache
- ✅ Basic API server
- ✅ Master wallet for payments

## 🔥 Next Steps

তোমার setup done! এখন আমরা build করবো:

**Week 1 remaining tasks:**
- [ ] Blockchain service (wallet generation, transaction monitoring)
- [ ] Payment processing engine
- [ ] Webhook system

**Week 2:**
- [ ] REST API endpoints
- [ ] Authentication system
- [ ] Real-time updates (Socket.io)

Check [Implementation Plan](docs/04-IMPLEMENTATION-PLAN.md) for detailed timeline.

## 🛠️ Useful Commands

```bash
# Start development server
pnpm dev

# Build all packages
pnpm build

# Run database migrations
pnpm migrate:dev

# Open Prisma Studio (database GUI)
pnpm studio

# View Docker logs
docker-compose logs -f

# Stop Docker services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart API server
# (tsx watch automatically restarts on file changes)

# Format code
pnpm format
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Docker services won't start
```bash
# Check Docker is running
docker --version
docker-compose --version

# Restart Docker Desktop

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d postgres
sleep 10
cd packages/api && pnpm migrate:dev
```

### Prisma errors
```bash
# Regenerate Prisma Client
cd packages/api
pnpm prisma generate

# Reset database (⚠️ deletes all data!)
pnpm prisma migrate reset
```

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Docs](https://expressjs.com/)
- [ethers.js Docs](https://docs.ethers.org/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 🆘 Need Help?

- Check [Documentation Index](docs/INDEX.md)
- Read [Implementation Plan](docs/04-IMPLEMENTATION-PLAN.md)
- Review [Architecture](docs/02-ARCHITECTURE.md)

---

**Status:** ✅ Phase 1, Day 1 Complete - Project setup done!

**Next:** Build blockchain service (wallet generation & monitoring)
