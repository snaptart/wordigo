/**
 * Authentication Service
 *
 * Core authentication logic: registration, login, token management
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse
} from '../types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Register a new user with email and password
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  // Check if email already exists
  const existingEmail = await prisma.users.findUnique({
    where: { email: data.email }
  });

  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const existingUsername = await prisma.users.findUnique({
    where: { username: data.username }
  });

  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Generate verification token
  const verificationToken = uuidv4();

  // Create user
  const user = await prisma.users.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      name: data.name,
      verificationToken: verificationToken,
      emailVerified: false, // Set to false for production with email verification
      updatedAt: new Date() // Required field
    }
  });

  // For now, auto-verify in development (remove this in production)
  if (process.env.NODE_ENV === 'development') {
    await prisma.users.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, updatedAt: new Date() }
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.username);
  const refreshToken = generateRefreshToken(user.id, user.email, user.username);

  // Store refresh token in database
  await prisma.refresh_tokens.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  return {
    user: formatUserResponse(user),
    accessToken,
    refreshToken
  };
}

/**
 * Login with email and password
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  // Find user by email
  const user = await prisma.users.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if password exists (OAuth users might not have password)
  if (!user.password) {
    throw new Error('Please login with Google');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if email is verified (optional - disable for development)
  // if (!user.emailVerified) {
  //   throw new Error('Please verify your email before logging in');
  // }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.username);
  const refreshToken = generateRefreshToken(user.id, user.email, user.username, data.rememberMe);

  // Store refresh token
  const expiryDays = data.rememberMe ? 90 : 30;
  await prisma.refresh_tokens.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    }
  });

  // Update last login
  await prisma.users.update({
    where: { id: user.id },
    data: { lastLogin: new Date(), updatedAt: new Date() }
  });

  return {
    user: formatUserResponse(user),
    accessToken,
    refreshToken
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify refresh token
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refresh_tokens.findUnique({
    where: { token: refreshToken }
  });

  if (!storedToken) {
    throw new Error('Refresh token not found');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refresh_tokens.delete({
      where: { token: refreshToken }
    });
    throw new Error('Refresh token expired');
  }

  // Get fresh user data
  const user = await prisma.users.findUnique({
    where: { id: payload.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.email, user.username);

  return { accessToken };
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refresh_tokens.delete({
    where: { token: refreshToken }
  }).catch(() => {
    // Token might not exist, ignore error
  });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<UserResponse | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return null;
  }

  return formatUserResponse(user);
}

/**
 * Format user data for API response
 */
function formatUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    profilePicture: user.profilePicture,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt
  };
}

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById
};
