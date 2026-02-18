-- Initial Database Schema for PeptiPay Gateway
-- This is a temporary solution to get the server running

-- Create enum types
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "Currency" AS ENUM ('USDT', 'USDC', 'BUSD');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PAID', 'CONFIRMED', 'SETTLED', 'EXPIRED', 'FAILED');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- Merchants table
CREATE TABLE IF NOT EXISTS "merchants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL UNIQUE,
    "walletAddress" TEXT NOT NULL,
    "coldWalletAddress" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Orders table
CREATE TABLE IF NOT EXISTS "payment_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "feeAmount" DECIMAL(18,8) NOT NULL,
    "netAmount" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "paymentAddress" TEXT NOT NULL UNIQUE,
    "addressIndex" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "successUrl" TEXT,
    "cancelUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "payment_orders_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentOrderId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL UNIQUE,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "transactions_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Webhook Deliveries table
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentOrderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS "withdrawals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" "Currency" NOT NULL,
    "toAddress" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "twoFactorCode" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "permissions" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "payment_orders_merchantId_idx" ON "payment_orders"("merchantId");
CREATE INDEX IF NOT EXISTS "payment_orders_status_idx" ON "payment_orders"("status");
CREATE INDEX IF NOT EXISTS "payment_orders_paymentAddress_idx" ON "payment_orders"("paymentAddress");
CREATE INDEX IF NOT EXISTS "payment_orders_createdAt_idx" ON "payment_orders"("createdAt");

CREATE INDEX IF NOT EXISTS "transactions_paymentOrderId_idx" ON "transactions"("paymentOrderId");
CREATE INDEX IF NOT EXISTS "transactions_txHash_idx" ON "transactions"("txHash");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");

CREATE INDEX IF NOT EXISTS "webhook_deliveries_paymentOrderId_idx" ON "webhook_deliveries"("paymentOrderId");
CREATE INDEX IF NOT EXISTS "webhook_deliveries_success_idx" ON "webhook_deliveries"("success");

CREATE INDEX IF NOT EXISTS "audit_logs_merchantId_idx" ON "audit_logs"("merchantId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "withdrawals_merchantId_idx" ON "withdrawals"("merchantId");
CREATE INDEX IF NOT EXISTS "withdrawals_status_idx" ON "withdrawals"("status");

CREATE INDEX IF NOT EXISTS "api_keys_merchantId_idx" ON "api_keys"("merchantId");
CREATE INDEX IF NOT EXISTS "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- Success message
SELECT 'Database schema created successfully!' as message;
