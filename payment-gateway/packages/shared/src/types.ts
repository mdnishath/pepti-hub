// Shared types for PeptiPay Gateway

export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  SETTLED = 'settled',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export enum Currency {
  USDT = 'USDT',
  USDC = 'USDC',
  BUSD = 'BUSD'
}

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet'
}

export interface PaymentOrder {
  id: string;
  merchantId: string;
  orderId: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  currency: Currency;
  paymentAddress: string;
  status: PaymentStatus;
  expiresAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  paymentOrderId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress: string;
  blockNumber: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  detectedAt: Date;
  confirmedAt?: Date;
}

export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  apiKeyHash: string;
  walletAddress: string;
  coldWalletAddress?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  feePercentage: number;
  status: 'active' | 'suspended';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: Currency;
  orderId: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResponse {
  paymentId: string;
  paymentAddress: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  currency: Currency;
  qrCode: string;
  checkoutUrl: string;
  expiresAt: string;
  status: PaymentStatus;
}

export interface WebhookPayload {
  event: string;
  paymentId: string;
  orderId: string;
  amount: string;
  currency: Currency;
  status: PaymentStatus;
  txHash?: string;
  confirmations?: number;
  confirmedAt?: string;
  metadata?: Record<string, any>;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}
