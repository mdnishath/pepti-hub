import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { WalletService, ProviderService } from '@pptpay/blockchain';
import { initializePaymentRoutes } from './routes/payments';
import { initializeMerchantRoutes } from './routes/merchants';
import { initializeAdminRoutes } from './routes/admin';
import { SettlementService } from './services/SettlementService';
import { TransactionMonitor } from './services/TransactionMonitor';
import { PaymentService } from './services/PaymentService';
import { WebhookService } from './services/WebhookService';
import { WebhookWorker } from './services/WebhookWorker';
import { GasFundingService } from './services/GasFundingService';
import { FundsRecoveryService } from './services/FundsRecoveryService';

// Load environment variables from root
import path from 'path';
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const apiEnvPath = path.resolve(__dirname, '../.env');

console.log('[ENV] Loading environment from:', rootEnvPath);
dotenv.config({ path: rootEnvPath });

console.log('[ENV] Loading environment from:', apiEnvPath);
dotenv.config({ path: apiEnvPath });

// Debug: Check what BLOCKCHAIN_NETWORK value was loaded
console.log('[ENV] BLOCKCHAIN_NETWORK =', process.env.BLOCKCHAIN_NETWORK);
console.log('[ENV] BSC_RPC_URL =', process.env.BSC_RPC_URL);

const app = express();
const httpServer = createServer(app);

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize blockchain services
const walletService = new WalletService({
  mnemonic: process.env.MASTER_MNEMONIC!,
  network: (process.env.BLOCKCHAIN_NETWORK as 'mainnet' | 'testnet') || 'testnet'
});

const providerService = new ProviderService({
  network: (process.env.BLOCKCHAIN_NETWORK as 'mainnet' | 'testnet') || 'testnet',
  rpcUrl: process.env.BSC_RPC_URL!,
  fallbackRpcUrl: process.env.BSC_RPC_FALLBACK_URL
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like file://, mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://10.5.0.2:3001',
      'null' // For file:// protocol
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || origin === 'null') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Initialize services
const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
const platformWallet = process.env.PLATFORM_HOT_WALLET || '0x7986FBD8BFC645234d5cBc00f89976707AeC6822';
const webhookSigningSecret = process.env.WEBHOOK_SIGNING_SECRET || 'default-secret';

// Payment and Settlement services
const paymentService = new PaymentService(prisma, walletService);
const settlementService = new SettlementService(
  prisma,
  walletService,
  providerService,
  platformWallet
);

// Gas Funding and Recovery services
const gasFundingService = new GasFundingService(
  walletService,
  providerService,
  platformWallet
);
const fundsRecoveryService = new FundsRecoveryService(
  prisma,
  walletService,
  providerService,
  platformWallet
);

// Webhook services
const webhookService = new WebhookService(prisma, webhookSigningSecret);
const webhookWorker = new WebhookWorker(
  prisma,
  webhookService,
  30 // Check queue every 30 seconds
);

// Transaction Monitor
const transactionMonitor = new TransactionMonitor(
  prisma,
  providerService,
  paymentService,
  settlementService,
  {
    network: (process.env.BLOCKCHAIN_NETWORK as 'mainnet' | 'testnet') || 'testnet',
    confirmationsRequired: parseInt(process.env.REQUIRED_CONFIRMATIONS || '12')
  }
);

// Initialize routes with services
const paymentRoutes = initializePaymentRoutes(prisma, walletService, providerService, jwtSecret, transactionMonitor);
const merchantRoutes = initializeMerchantRoutes(prisma, jwtSecret);
const adminRoutes = initializeAdminRoutes(
  prisma,
  settlementService,
  webhookWorker,
  transactionMonitor,
  gasFundingService,
  fundsRecoveryService
);

// API routes
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'PeptiPay Gateway API',
    version: '1.0.0',
    endpoints: {
      merchants: '/api/v1/merchants',
      payments: '/api/v1/payments'
    },
    documentation: '/api/v1/docs'
  });
});

// Mount routes
app.use('/api/v1/merchants', merchantRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 PeptiPay Gateway API Server                         ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Port: ${PORT}                                              ║
║   URL: http://localhost:${PORT}                            ║
║                                                           ║
║   Health Check: http://localhost:${PORT}/health            ║
║   API: http://localhost:${PORT}/api/v1                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start background services
  try {
    await transactionMonitor.start();
    console.log('✅ Transaction monitor started with automatic settlement');
  } catch (error) {
    console.error('❌ Failed to start transaction monitor:', error);
  }

  try {
    await webhookWorker.start();
    console.log('✅ Webhook worker started with retry queue processing');
  } catch (error) {
    console.error('❌ Failed to start webhook worker:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    transactionMonitor.stop();
    webhookWorker.stop();
    await prisma.$disconnect();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(async () => {
    transactionMonitor.stop();
    webhookWorker.stop();
    await prisma.$disconnect();
    console.log('HTTP server closed');
    process.exit(0);
  });
});
