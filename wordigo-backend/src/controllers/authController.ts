/**
 * Authentication Controller
 *
 * HTTP handlers for authentication endpoints
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById
} from '../services/authService';
import { ApiResponse, RegisterRequest, LoginRequest } from '../types';

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req: Request, res: Response) {
  try {
    const data: RegisterRequest = req.body;

    // Validate required fields
    if (!data.email || !data.username || !data.password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      } as ApiResponse<null>);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      } as ApiResponse<null>);
    }

    // Validate username (alphanumeric, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(data.username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-20 characters (letters, numbers, underscore only)'
      } as ApiResponse<null>);
    }

    // Validate password strength (min 8 chars)
    if (data.password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      } as ApiResponse<null>);
    }

    const result = await registerUser(data);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    console.error('Registration error:', error);

    const statusCode = error.message.includes('already') ? 409 : 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Registration failed'
    } as ApiResponse<null>);
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(req: Request, res: Response) {
  try {
    const data: LoginRequest = req.body;

    // Validate required fields
    if (!data.email || !data.password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse<null>);
    }

    const result = await loginUser(data);

    // Set refresh token in httpOnly cookie
    const maxAge = data.rememberMe ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    return res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    console.error('Login error:', error);

    const statusCode = error.message.includes('Invalid') ? 401 : 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Login failed'
    } as ApiResponse<null>);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export async function refresh(req: Request, res: Response) {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      } as ApiResponse<null>);
    }

    const result = await refreshAccessToken(refreshToken);

    return res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>);

  } catch (error: any) {
    console.error('Refresh token error:', error);

    return res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed'
    } as ApiResponse<null>);
  }
}

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    return res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    } as ApiResponse<any>);

  } catch (error: any) {
    console.error('Logout error:', error);

    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    } as ApiResponse<null>);
  }
}

/**
 * GET /api/auth/me
 * Get current user (protected route)
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    // User ID is attached by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      data: user
    } as ApiResponse<typeof user>);

  } catch (error: any) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to get user'
    } as ApiResponse<null>);
  }
}

/**
 * PUT /api/auth/update-profile
 * Update user profile (protected route)
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    const { name, email } = req.body;

    // If email is being changed, check if it's already taken
    if (email) {
      const existingEmail = await getUserById(userId);
      if (existingEmail && existingEmail.email !== email) {
        const emailTaken = await prisma.users.findUnique({
          where: { email }
        });
        if (emailTaken) {
          return res.status(409).json({
            success: false,
            error: 'Email already in use'
          } as ApiResponse<null>);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        profilePicture: updatedUser.profilePicture,
        emailVerified: updatedUser.emailVerified
      }
    } as ApiResponse<any>);

  } catch (error: any) {
    console.error('Update profile error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    } as ApiResponse<null>);
  }
}

/**
 * PUT /api/auth/change-password
 * Change user password (protected route)
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      } as ApiResponse<null>);
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      } as ApiResponse<null>);
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      } as ApiResponse<null>);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    } as ApiResponse<any>);

  } catch (error: any) {
    console.error('Change password error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to change password'
    } as ApiResponse<null>);
  }
}

export default {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword
};
