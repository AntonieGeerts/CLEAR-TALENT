import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, AuthenticationError, AuthorizationError } from '../types';
import { AuthService } from '../services/auth/auth-service';
import { apiLogger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const payload = AuthService.verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Attach user and tenant to request
    req.user = user;
    req.tenant = user.tenant;

    next();
  } catch (error) {
    apiLogger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(`Requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Check if user has opted out of AI features
 */
export const checkAIOptOut = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.aiOptOut) {
    return next(
      new AuthorizationError('You have opted out of AI features. Please contact your administrator.')
    );
  }
  next();
};
