/**
 * Tenant Context Middleware
 *
 * Ensures proper tenant isolation for all requests by:
 * 1. Validating tenant context from authenticated user
 * 2. Preventing cross-tenant data access
 * 3. Providing tenant context for database queries
 * 4. Supporting tenant switching for SYSTEM_ADMIN users
 *
 * Usage:
 *   // Basic tenant context validation
 *   router.get('/staff', authenticate, tenantContext(), handler);
 *
 *   // Validate tenant ID in URL matches user's tenant
 *   router.get('/tenants/:tenantId/settings', authenticate, tenantContext({
 *     getTenantId: (req) => req.params.tenantId
 *   }), handler);
 *
 *   // Allow system admins to access any tenant
 *   router.get('/admin/tenants/:tenantId/users', authenticate, tenantContext({
 *     getTenantId: (req) => req.params.tenantId,
 *     allowSystemAdmin: true
 *   }), handler);
 */

import { Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { AuthRequest, AuthorizationError, AuthenticationError } from '../types';
import { logger } from '../utils/logger';
import { provisionMembershipForUser } from '../lib/access-control-bootstrap';

const prisma = new PrismaClient();

export interface TenantContextOptions {
  /**
   * Extract tenant ID from request (e.g., from URL params)
   * If provided, validates that user has access to this tenant
   */
  getTenantId?: (req: AuthRequest) => string | undefined;

  /**
   * Allow SYSTEM_ADMIN users to access any tenant
   * Default: false
   */
  allowSystemAdmin?: boolean;

  /**
   * Skip tenant validation (useful for tenant creation endpoints)
   * Default: false
   */
  skipValidation?: boolean;

  /**
   * Custom error message if tenant access denied
   */
  errorMessage?: string;
}

/**
 * Middleware factory for tenant context validation
 */
export function tenantContext(options: TenantContextOptions = {}) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const user = req.user;

      // Skip validation if requested (e.g., for tenant creation)
      if (options.skipValidation) {
        return next();
      }

      // Extract tenant ID from request if provided
      const requestedTenantId = options.getTenantId
        ? options.getTenantId(req)
        : undefined;

      // System admins can access any tenant if allowed
      if (options.allowSystemAdmin && user.role === 'SYSTEM_ADMIN') {
        // If tenant ID is in request, validate it exists
        if (requestedTenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: requestedTenantId },
          });

          if (!tenant) {
            throw new AuthorizationError('Tenant not found');
          }

          // Attach requested tenant to request for query scoping
          req.tenant = tenant as any;
        } else if (req.tenant) {
          // Use existing tenant from auth middleware
          // No additional validation needed
        } else {
          // System admin without tenant context - this might be intentional
          // for system-wide operations
          logger.debug('System admin request without tenant context', {
            userId: user.id,
            path: req.path,
          });
        }

        return next();
      }

      // Regular users must have a tenant
      if (!user.tenantId) {
        throw new AuthorizationError('User does not belong to a tenant');
      }

      // If tenant ID is in request, validate it matches user's tenant
      if (requestedTenantId && requestedTenantId !== user.tenantId) {
        const message =
          options.errorMessage ||
          'Access denied: Cannot access resources from a different tenant';

        logger.warn('Cross-tenant access attempt', {
          userId: user.id,
          userTenantId: user.tenantId,
          requestedTenantId,
          path: req.path,
        });

        throw new AuthorizationError(message);
      }

      // Ensure tenant exists and user has active membership
      let membership = await prisma.tenantUserMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: user.tenantId,
            userId: user.id,
          },
        },
        include: {
          tenant: true,
        },
      });

      if (!membership) {
        membership = await provisionMembershipForUser(prisma, {
          id: user.id,
          tenantId: user.tenantId,
          role: (user.role as UserRole) || UserRole.EMPLOYEE,
        });
      }

      if (!membership) {
        throw new AuthorizationError('User membership not found');
      }

      if (membership.status !== 'ACTIVE') {
        throw new AuthorizationError(
          `User membership is ${membership.status}. Please contact your administrator.`
        );
      }

      // Attach tenant and membership to request for easy access
      req.tenant = membership.tenant as any;
      (req as any).membership = membership;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        next(error);
      } else {
        logger.error('Tenant context middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: req.user?.id,
          path: req.path,
        });
        next(new AuthorizationError('Tenant validation failed'));
      }
    }
  };
}

/**
 * Helper to validate tenant ownership of a resource
 *
 * Usage in route handlers:
 *   const competency = await prisma.competency.findUnique({ where: { id } });
 *   validateTenantOwnership(req, competency.tenantId);
 */
export function validateTenantOwnership(
  req: AuthRequest,
  resourceTenantId: string | null
): void {
  // Allow if no user (should be caught by auth middleware)
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  // System admins can access any tenant
  if (req.user.role === 'SYSTEM_ADMIN') {
    return;
  }

  // Regular users must match tenant
  if (req.user.tenantId !== resourceTenantId) {
    logger.warn('Cross-tenant resource access attempt', {
      userId: req.user.id,
      userTenantId: req.user.tenantId,
      resourceTenantId,
    });
    throw new AuthorizationError('Access denied: Resource belongs to a different tenant');
  }
}

/**
 * Helper to get tenant-scoped query filter
 *
 * Usage in route handlers:
 *   const filter = getTenantFilter(req);
 *   const competencies = await prisma.competency.findMany({ where: filter });
 */
export function getTenantFilter(req: AuthRequest): { tenantId: string } | undefined {
  // System admins see all tenants
  if (req.user?.role === 'SYSTEM_ADMIN' && !req.tenant) {
    return undefined;
  }

  // Regular users or system admins with tenant context see only their tenant
  const tenantId = req.tenant?.id || req.user?.tenantId;

  if (!tenantId) {
    throw new AuthorizationError('No tenant context available');
  }

  return { tenantId };
}

/**
 * Helper to enforce tenant isolation in Prisma queries
 *
 * Usage in route handlers:
 *   const competency = await findWithTenantCheck(
 *     req,
 *     prisma.competency.findUnique({ where: { id } })
 *   );
 */
export async function findWithTenantCheck<T extends { tenantId: string | null }>(
  req: AuthRequest,
  query: Promise<T | null>
): Promise<T | null> {
  const result = await query;

  if (!result) {
    return null;
  }

  // Validate tenant ownership
  validateTenantOwnership(req, result.tenantId);

  return result;
}

/**
 * Middleware to ensure tenant exists and is active
 *
 * Usage:
 *   router.post('/reviews', authenticate, tenantContext(), requireActiveTenant, handler);
 */
export const requireActiveTenant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.tenant) {
      throw new AuthorizationError('No tenant context available');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
    });

    if (!tenant) {
      throw new AuthorizationError('Tenant not found');
    }

    // Check if tenant is active (assuming a status field exists)
    // If status field doesn't exist yet, this check can be removed
    const settings = tenant.settings as any;
    if (settings?.status && settings.status !== 'ACTIVE') {
      throw new AuthorizationError(
        `Tenant is ${settings.status}. Please contact support.`
      );
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      next(error);
    } else {
      logger.error('Require active tenant middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId: req.tenant?.id,
      });
      next(new AuthorizationError('Tenant validation failed'));
    }
  }
};
