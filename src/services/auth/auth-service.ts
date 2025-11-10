import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { AuthenticationError, ValidationError } from '../../types';
import { apiLogger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string | null;
    department?: string | null;
    position?: string | null;
  };
  token: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  tenantId: string | null;
  role: string;
  email: string;
}

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Generate tokens
      const token = this.generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      });

      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      });

      apiLogger.info('User logged in', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          department: user.department,
          position: user.position,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      apiLogger.error('Login failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Register a new user
   */
  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    department?: string,
    position?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          tenantId,
          role: 'EMPLOYEE',
          department,
          position,
        },
      });

      apiLogger.info('User registered', { userId: user.id, email: user.email });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        department: user.department,
        position: user.position,
      };
    } catch (error) {
      apiLogger.error('Registration failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Generate access token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as any);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as any);
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const payload = this.verifyToken(refreshToken);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new access token
      const token = this.generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      });

      return { token };
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        tenantId: true,
        aiOptOut: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return user;
  }
}

export default AuthService;
