/**
 * JWT Utility Functions
 *
 * Handles token generation and verification
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(userId: number, email: string, username: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    username,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'wordigo-api',
    audience: 'wordigo-app'
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(userId: number, email: string, username: string, rememberMe: boolean = false): string {
  const payload: JWTPayload = {
    userId,
    email,
    username,
    type: 'refresh'
  };

  const expiry = rememberMe ? '90d' : REFRESH_TOKEN_EXPIRY;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiry,
    issuer: 'wordigo-api',
    audience: 'wordigo-app'
  });
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'wordigo-api',
      audience: 'wordigo-app'
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'wordigo-api',
      audience: 'wordigo-app'
    }) as JWTPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
