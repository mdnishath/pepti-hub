import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SettlementService } from '../services/SettlementService';
import { WebhookWorker } from '../services/WebhookWorker';
import { TransactionMonitor } from '../services/TransactionMonitor';
import { GasFundingService } from '../services/GasFundingService';
import { FundsRecoveryService } from '../services/FundsRecoveryService';
import { adminAuth } from '../middleware/adminAuth';

let prisma: PrismaClient;
let settlementService: SettlementService;
let webhookWorker: WebhookWorker;
let transactionMonitor: TransactionMonitor;
let gasFundingService: GasFundingService;
let fundsRecoveryService: FundsRecoveryService;

export function initializeAdminRoutes(
  prismaClient: PrismaClient,
  settlement: SettlementService,
  webhook: WebhookWorker,
  txMonitor: TransactionMonitor,
  gasFunding: GasFundingService,
  fundsRecovery: FundsRecoveryService
): Router {
  prisma = prismaClient;
  settlementService = settlement;
  webhookWorker = webhook;
  transactionMonitor = txMonitor;
  gasFundingService = gasFunding;
  fundsRecoveryService = fundsRecovery;

  const router = Router();

  // Apply admin authentication to all routes
  router.use(adminAuth(prisma));

  /**
   * GET /api/v1/admin/dashboard
   * Get platform-wide dashboard statistics
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const [
        totalMerchants,
        activeMerchants,
        totalPayments,
        totalVolume,
        platformFees,
        pendingSettlements,
        failedWebhooks
      ] = await Promise.all([
        // Total merchants
        prisma.merchant.count(),

        // Active merchants (made payment in last 30 days)
        prisma.merchant.count({
          where: {
            paymentOrders: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }),

        // Total payments
        prisma.paymentOrder.count(),

        // Total volume (sum of all confirmed/settled payments)
        prisma.paymentOrder.aggregate({
          where: {
            status: {
              in: ['CONFIRMED', 'SETTLED']
            }
          },
          _sum: {
            amount: true
          }
        }),

        // Platform fees collected
        prisma.paymentOrder.aggregate({
          where: {
            status: {
              in: ['CONFIRMED', 'SETTLED']
            }
          },
          _sum: {
            feeAmount: true
          }
        }),

        // Pending settlements
        prisma.paymentOrder.count({
          where: {
            status: 'CONFIRMED',
            settledAt: null
          }
        }),

        // Failed webhooks
        prisma.webhookDelivery.count({
          where: {
            status: 'FAILED'
          }
        })
      ]);

      // Payment status breakdown
      const paymentsByStatus = await prisma.paymentOrder.groupBy({
        by: ['status'],
        _count: true
      });

      res.json({
        merchants: {
          total: totalMerchants,
          active: activeMerchants
        },
        payments: {
          total: totalPayments,
          byStatus: paymentsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {} as Record<string, number>)
        },
        volume: {
          total: totalVolume._sum.amount?.toString() || '0',
          platformFees: platformFees._sum.feeAmount?.toString() || '0'
        },
        pending: {
          settlements: pendingSettlements,
          webhooks: failedWebhooks
        },
        services: {
          transactionMonitor: transactionMonitor.getStatus(),
          webhookWorker: webhookWorker.getStatus()
        }
      });
    } catch (error) {
      console.error('[Admin] Dashboard error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch dashboard data'
      });
    }
  });

  /**
   * GET /api/v1/admin/merchants
   * List all merchants with pagination
   */
  router.get('/merchants', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [merchants, total] = await Promise.all([
        prisma.merchant.findMany({
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                paymentOrders: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.merchant.count()
      ]);

      // Get payment stats for each merchant
      const merchantsWithStats = await Promise.all(
        merchants.map(async (merchant) => {
          const stats = await prisma.paymentOrder.aggregate({
            where: {
              merchantId: merchant.id,
              status: {
                in: ['CONFIRMED', 'SETTLED']
              }
            },
            _sum: {
              amount: true,
              netAmount: true
            }
          });

          return {
            id: merchant.id,
            email: merchant.email,
            businessName: merchant.businessName,
            walletAddress: merchant.walletAddress,
            createdAt: merchant.createdAt,
            totalPayments: merchant._count.paymentOrders,
            totalVolume: stats._sum.amount?.toString() || '0',
            totalEarned: stats._sum.netAmount?.toString() || '0'
          };
        })
      );

      res.json({
        data: merchantsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('[Admin] List merchants error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch merchants'
      });
    }
  });

  /**
   * GET /api/v1/admin/merchants/:id
   * Get detailed merchant information
   */
  router.get('/merchants/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const merchant = await prisma.merchant.findUnique({
        where: { id },
        include: {
          paymentOrders: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              paymentOrders: true
            }
          }
        }
      });

      if (!merchant) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Merchant not found'
        });
      }

      res.json({
        ...merchant,
        passwordHash: undefined // Don't expose password hash
      });
    } catch (error) {
      console.error('[Admin] Get merchant error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch merchant details'
      });
    }
  });

  /**
   * GET /api/v1/admin/payments
   * List all payments with filtering
   */
  router.get('/payments', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const merchantId = req.query.merchantId as string;

      const where: any = {};
      if (status) where.status = status;
      if (merchantId) where.merchantId = merchantId;

      const [payments, total] = await Promise.all([
        prisma.paymentOrder.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchant: {
              select: {
                email: true,
                businessName: true
              }
            },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.paymentOrder.count({ where })
      ]);

      res.json({
        data: payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('[Admin] List payments error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch payments'
      });
    }
  });

  /**
   * GET /api/v1/admin/settlements/pending
   * Get payments waiting for settlement
   */
  router.get('/settlements/pending', async (req: Request, res: Response) => {
    try {
      const pendingSettlements = await settlementService.getPendingSettlements();

      const payments = await prisma.paymentOrder.findMany({
        where: {
          id: {
            in: pendingSettlements
          }
        },
        include: {
          merchant: {
            select: {
              email: true,
              businessName: true,
              walletAddress: true
            }
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      res.json({
        count: payments.length,
        data: payments
      });
    } catch (error) {
      console.error('[Admin] Pending settlements error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch pending settlements'
      });
    }
  });

  /**
   * POST /api/v1/admin/settlements/process
   * Manually trigger settlement processing
   */
  router.post('/settlements/process', async (req: Request, res: Response) => {
    try {
      const result = await settlementService.processAllPendingSettlements();

      res.json({
        message: 'Settlement processing completed',
        result
      });
    } catch (error) {
      console.error('[Admin] Process settlements error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process settlements'
      });
    }
  });

  /**
   * GET /api/v1/admin/webhooks/stats
   * Get webhook delivery statistics
   */
  router.get('/webhooks/stats', async (req: Request, res: Response) => {
    try {
      const stats = await webhookWorker.getQueueStats();
      res.json(stats);
    } catch (error) {
      console.error('[Admin] Webhook stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch webhook stats'
      });
    }
  });

  /**
   * GET /api/v1/admin/webhooks/failed
   * List failed webhook deliveries
   */
  router.get('/webhooks/failed', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [webhooks, total] = await Promise.all([
        prisma.webhookDelivery.findMany({
          where: {
            status: 'FAILED'
          },
          skip,
          take: limit,
          include: {
            paymentOrder: {
              include: {
                merchant: {
                  select: {
                    email: true,
                    businessName: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.webhookDelivery.count({
          where: {
            status: 'FAILED'
          }
        })
      ]);

      res.json({
        data: webhooks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('[Admin] Failed webhooks error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch failed webhooks'
      });
    }
  });

  /**
   * POST /api/v1/admin/webhooks/retry
   * Manually trigger webhook retry processing
   */
  router.post('/webhooks/retry', async (req: Request, res: Response) => {
    try {
      await webhookWorker.triggerProcessing();

      res.json({
        message: 'Webhook retry processing triggered'
      });
    } catch (error) {
      console.error('[Admin] Webhook retry error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to trigger webhook retry'
      });
    }
  });

  /**
   * GET /api/v1/admin/gas/status
   * Get gas funding wallet status
   */
  router.get('/gas/status', async (req: Request, res: Response) => {
    try {
      const status = await gasFundingService.getStatus();
      res.json(status);
    } catch (error) {
      console.error('[Admin] Gas status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch gas status'
      });
    }
  });

  /**
   * POST /api/v1/admin/gas/fund/:paymentId
   * Manually fund a payment address with gas
   */
  router.post('/gas/fund/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.paymentOrder.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Payment not found'
        });
      }

      const result = await gasFundingService.fundAddress(payment.paymentAddress);

      if (result.success) {
        res.json({
          message: 'Gas funding successful',
          txHash: result.txHash
        });
      } else {
        res.status(500).json({
          error: 'Gas funding failed',
          message: result.error
        });
      }
    } catch (error: any) {
      console.error('[Admin] Gas funding error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/admin/gas/recover/:paymentId
   * Recover leftover gas from a settled payment address
   */
  router.post('/gas/recover/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.paymentOrder.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Payment not found'
        });
      }

      if (payment.status !== 'SETTLED') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Payment must be settled before gas recovery'
        });
      }

      const result = await gasFundingService.recoverGas(payment.addressIndex);

      if (result.success) {
        res.json({
          message: 'Gas recovery successful',
          recovered: result.recovered,
          txHash: result.txHash
        });
      } else {
        res.status(500).json({
          error: 'Gas recovery failed',
          message: result.error
        });
      }
    } catch (error: any) {
      console.error('[Admin] Gas recovery error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/admin/recovery/summary
   * Get summary of recoverable funds
   */
  router.get('/recovery/summary', async (req: Request, res: Response) => {
    try {
      const summary = await fundsRecoveryService.getRecoverySummary();
      res.json(summary);
    } catch (error) {
      console.error('[Admin] Recovery summary error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch recovery summary'
      });
    }
  });

  /**
   * GET /api/v1/admin/recovery/payments
   * Get list of unsettled payments with balances
   */
  router.get('/recovery/payments', async (req: Request, res: Response) => {
    try {
      const payments = await fundsRecoveryService.getUnsettledPayments();
      res.json({
        count: payments.length,
        data: payments
      });
    } catch (error) {
      console.error('[Admin] Recovery payments error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch unsettled payments'
      });
    }
  });

  /**
   * POST /api/v1/admin/recovery/recover/:paymentId
   * Recover funds from a specific payment address
   */
  router.post('/recovery/recover/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const result = await fundsRecoveryService.recoverFromAddress(paymentId);

      if (result.success) {
        res.json({
          message: 'Funds recovered successfully',
          usdtRecovered: result.usdtRecovered,
          bnbRecovered: result.bnbRecovered,
          txHashes: result.txHashes
        });
      } else {
        res.status(500).json({
          error: 'Recovery failed',
          message: result.error
        });
      }
    } catch (error: any) {
      console.error('[Admin] Recover funds error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/admin/recovery/recover-all
   * Recover funds from all unsettled payment addresses
   */
  router.post('/recovery/recover-all', async (req: Request, res: Response) => {
    try {
      const result = await fundsRecoveryService.recoverAll();

      res.json({
        message: 'Bulk recovery completed',
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        totalUSDT: result.totalUSDT,
        totalBNB: result.totalBNB,
        results: result.results
      });
    } catch (error: any) {
      console.error('[Admin] Recover all error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  console.log('[AdminRoutes] ✅ Admin routes initialized');

  return router;
}
