/**
 * Authentication Middleware
 *
 * Protects routes by verifying JWT access tokens
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { JWTPayload } from '../types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Require authentication
 * Verifies access token and attaches user data to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user data to request
    req.user = payload;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token'
    });
  }
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't reject if missing
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Invalid token - continue without auth
    next();
  }
}

export default {
  requireAuth,
  optionalAuth
};
