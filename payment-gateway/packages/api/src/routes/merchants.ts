import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';
import { jwtAuth, apiKeyAuth } from '../middleware/auth';

let authService: AuthService;
let prisma: PrismaClient;

export function initializeMerchantRoutes(prismaClient: PrismaClient, jwtSecret: string): Router {
  prisma = prismaClient;
  authService = new AuthService(prisma, jwtSecret);
  console.log('[MerchantRoutes] ✅ Merchant routes initialized');

  const router = Router();

  /**
   * POST /api/v1/merchants/register
   * Register a new merchant
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, businessName, walletAddress } = req.body;

      // Validate required fields
      if (!email || !password || !businessName || !walletAddress) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: email, password, businessName, walletAddress'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Password must be at least 8 characters long'
        });
      }

      // Validate wallet address format
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid wallet address format'
        });
      }

      const result = await authService.register({
        email,
        password,
        businessName,
        walletAddress
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Registration error:', error);

      if (error.message === 'Email already registered') {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/merchants/login
   * Login merchant
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: email, password'
        });
      }

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Login error:', error);

      if (error.message === 'Invalid credentials' || error.message === 'Account is suspended') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/merchants/me
   * Get current merchant profile (requires JWT auth)
   */
  router.get('/me', jwtAuth(authService), async (req: Request, res: Response) => {
    try {
      const merchant = await authService.getMerchantById(req.merchantId!);

      res.json({
        success: true,
        data: merchant
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Get profile error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/merchants/api-key/regenerate
   * Regenerate API key (requires JWT auth)
   */
  router.post('/api-key/regenerate', jwtAuth(authService), async (req: Request, res: Response) => {
    try {
      const apiKey = await authService.regenerateApiKey(req.merchantId!);

      res.json({
        success: true,
        data: {
          apiKey,
          message: 'API key regenerated successfully. Save this key securely, it will not be shown again.'
        }
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Regenerate API key error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/merchants/stats
   * Get merchant statistics (requires JWT auth)
   */
  router.get('/stats', jwtAuth(authService), async (req: Request, res: Response) => {
    try {
      const merchantId = req.merchantId!;

      // Get payment statistics
      const [totalPayments, successfulPayments, totalRevenue, todayRevenue, averageAmount] = await Promise.all([
        // Total payments
        prisma.paymentOrder.count({
          where: { merchantId }
        }),

        // Successful payments
        prisma.paymentOrder.count({
          where: {
            merchantId,
            status: { in: ['CONFIRMED', 'SETTLED'] }
          }
        }),

        // Total revenue (netAmount)
        prisma.paymentOrder.aggregate({
          where: {
            merchantId,
            status: { in: ['CONFIRMED', 'SETTLED'] }
          },
          _sum: { netAmount: true }
        }),

        // Today's revenue
        prisma.paymentOrder.aggregate({
          where: {
            merchantId,
            status: { in: ['CONFIRMED', 'SETTLED'] },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { netAmount: true }
        }),

        // Average amount per payment
        prisma.paymentOrder.aggregate({
          where: {
            merchantId,
            status: { in: ['CONFIRMED', 'SETTLED'] }
          },
          _avg: { netAmount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalPayments,
          successfulPayments,
          totalRevenue: totalRevenue._sum.netAmount?.toString() || '0',
          todayRevenue: todayRevenue._sum.netAmount?.toString() || '0',
          averageAmount: averageAmount._avg.netAmount?.toString() || '0',
          successRate: totalPayments > 0
            ? ((successfulPayments / totalPayments) * 100).toFixed(2)
            : '0'
        }
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Get stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/merchants/payments
   * Get merchant's payment history (requires JWT auth)
   */
  router.get('/payments', jwtAuth(authService), async (req: Request, res: Response) => {
    try {
      const merchantId = req.merchantId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.paymentOrder.findMany({
          where: { merchantId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
          select: {
            id: true,
            orderId: true,
            amount: true,
            feeAmount: true,
            netAmount: true,
            currency: true,
            paymentAddress: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            confirmedAt: true
          }
        }),

        prisma.paymentOrder.count({
          where: { merchantId }
        })
      ]);

      res.json({
        success: true,
        data: {
          payments: payments.map(p => ({
            ...p,
            amount: p.amount.toString(),
            feeAmount: p.feeAmount.toString(),
            netAmount: p.netAmount.toString()
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error: any) {
      console.error('[MerchantRoutes] Get payments error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  return router;
}
