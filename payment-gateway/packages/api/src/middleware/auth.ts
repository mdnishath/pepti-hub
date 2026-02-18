import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

// Extend Express Request to include merchant info
declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Checks Bearer token in Authorization header
 */
export function jwtAuth(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const { merchantId } = authService.verifyToken(token);

      // Attach merchant ID to request
      req.merchantId = merchantId;

      next();
    } catch (error: any) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message || 'Invalid token'
      });
    }
  };
}

/**
 * API Key Authentication Middleware
 * Checks X-API-Key header
 */
export function apiKeyAuth(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing API key'
        });
      }

      // Verify API key
      const merchantId = await authService.verifyApiKey(apiKey);

      // Attach merchant ID to request
      req.merchantId = merchantId;

      next();
    } catch (error: any) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message || 'Invalid API key'
      });
    }
  };
}
