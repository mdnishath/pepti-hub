import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * Admin authentication middleware
 * Checks for admin API key in Authorization header
 */
export function adminAuth(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Admin API key required'
        });
      }

      const adminKey = authHeader.substring(7);

      // Check against environment variable admin key
      const expectedAdminKey = process.env.ADMIN_API_KEY;

      if (!expectedAdminKey) {
        console.error('[AdminAuth] ADMIN_API_KEY not configured');
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'Admin authentication not configured'
        });
      }

      if (adminKey !== expectedAdminKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid admin API key'
        });
      }

      // Admin authenticated
      next();
    } catch (error) {
      console.error('[AdminAuth] Error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication failed'
      });
    }
  };
}
