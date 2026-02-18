import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface RegisterMerchantParams {
  email: string;
  password: string;
  businessName: string;
  walletAddress: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  merchant: {
    id: string;
    email: string;
    businessName: string;
    walletAddress: string;
    status: string;
  };
  token: string;
  apiKey: string;
}

export class AuthService {
  private prisma: PrismaClient;
  private jwtSecret: string;

  constructor(prisma: PrismaClient, jwtSecret: string) {
    this.prisma = prisma;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Register a new merchant
   */
  async register(params: RegisterMerchantParams): Promise<AuthResponse> {
    // Check if email already exists
    const existing = await this.prisma.merchant.findUnique({
      where: { email: params.email }
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(params.password, 10);

    // Generate API key
    const apiKey = this.generateApiKey();
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Create merchant
    const merchant = await this.prisma.merchant.create({
      data: {
        email: params.email,
        passwordHash,
        businessName: params.businessName,
        walletAddress: params.walletAddress,
        apiKeyHash,
        status: 'ACTIVE',
        emailVerified: false
      }
    });

    // Generate JWT token
    const token = this.generateToken(merchant.id);

    console.log(`[AuthService] Merchant registered: ${merchant.email}`);

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        businessName: merchant.businessName,
        walletAddress: merchant.walletAddress,
        status: merchant.status
      },
      token,
      apiKey // Return API key only once during registration
    };
  }

  /**
   * Login merchant
   */
  async login(params: LoginParams): Promise<Omit<AuthResponse, 'apiKey'>> {
    // Find merchant
    const merchant = await this.prisma.merchant.findUnique({
      where: { email: params.email }
    });

    if (!merchant) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (merchant.status !== 'ACTIVE') {
      throw new Error('Account is suspended');
    }

    // Verify password
    const isValid = await bcrypt.compare(params.password, merchant.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(merchant.id);

    console.log(`[AuthService] Merchant logged in: ${merchant.email}`);

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        businessName: merchant.businessName,
        walletAddress: merchant.walletAddress,
        status: merchant.status
      },
      token
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { merchantId: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { merchantId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string): Promise<string> {
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const merchant = await this.prisma.merchant.findUnique({
      where: { apiKeyHash }
    });

    if (!merchant || merchant.status !== 'ACTIVE') {
      throw new Error('Invalid API key');
    }

    return merchant.id;
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(merchantId: string): Promise<string> {
    const apiKey = this.generateApiKey();
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { apiKeyHash }
    });

    console.log(`[AuthService] API key regenerated for merchant: ${merchantId}`);

    return apiKey;
  }

  /**
   * Get merchant by ID
   */
  async getMerchantById(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        businessName: true,
        walletAddress: true,
        coldWalletAddress: true,
        webhookUrl: true,
        feePercentage: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    return merchant;
  }

  /**
   * Generate JWT token
   */
  private generateToken(merchantId: string): string {
    return jwt.sign(
      { merchantId },
      this.jwtSecret,
      { expiresIn: '7d' } // Token valid for 7 days
    );
  }

  /**
   * Generate random API key
   */
  private generateApiKey(): string {
    return `ppt_${crypto.randomBytes(32).toString('hex')}`;
  }
}
