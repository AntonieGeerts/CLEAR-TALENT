/**
 * Authorization Middleware
 *
 * Permission-based authorization using the Access Control Service.
 * Supports resource-based and scope-aware permission checking.
 *
 * Usage:
 *   // Basic permission check
 *   router.get('/staff', authenticate, authorize({ resource: 'staff', action: 'read' }), handler);
 *
 *   // Resource-based check (checks access to specific user)
 *   router.put('/staff/:userId', authenticate, authorize({
 *     resource: 'staff',
 *     action: 'update',
 *     getTargetUserId: (req) => req.params.userId
 *   }), handler);
 *
 *   // Multiple permissions (any of them grants access)
 *   router.post('/reviews', authenticate, authorizeAny([
 *     { resource: 'review', action: 'create' },
 *     { resource: 'review', action: 'manage' }
 *   ]), handler);
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, AuthorizationError, AuthenticationError } from '../types';
import { AccessControlService, PermissionCheckInput } from '../services/access-control';
import { logger } from '../utils/logger';

const accessControl = new AccessControlService();

export interface AuthorizeOptions {
  /** Resource being accessed (e.g., 'staff', 'review', 'role') */
  resource: string;

  /** Action being performed (e.g., 'read', 'create', 'update', 'delete', 'manage') */
  action: string;

  /** Extract target user ID from request (for SELF/TEAM scope checks) */
  getTargetUserId?: (req: AuthRequest) => string | undefined;

  /** Extract target department from request (for TEAM scope checks) */
  getTargetDepartment?: (req: AuthRequest) => string | undefined;

  /** Extract target team from request (for TEAM scope checks) */
  getTargetTeam?: (req: AuthRequest) => string | undefined;

  /** Additional context for permission evaluation */
  getContext?: (req: AuthRequest) => Record<string, any>;

  /** Custom error message if permission denied */
  errorMessage?: string;
}

/**
 * Middleware factory for permission-based authorization
 */
export function authorize(options: AuthorizeOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      // Extract tenant and user IDs
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      if (!tenantId) {
        throw new AuthorizationError('User does not belong to a tenant');
      }

      // Build permission check context
      const context: PermissionCheckInput['context'] = {
        ...(options.getContext ? options.getContext(req) : {}),
      };

      // Add target user ID if provided
      if (options.getTargetUserId) {
        context.targetUserId = options.getTargetUserId(req);
      }

      // Add target department if provided
      if (options.getTargetDepartment) {
        context.targetDepartment = options.getTargetDepartment(req);
      }

      // Add target team if provided
      if (options.getTargetTeam) {
        context.targetTeam = options.getTargetTeam(req);
      }

      // Check permission
      const result = await accessControl.checkPermission({
        tenantId,
        userId,
        resource: options.resource,
        action: options.action,
        context,
      });

      if (!result.allowed) {
        const message = options.errorMessage || result.reason || 'Access denied';
        logger.warn('Authorization failed', {
          userId,
          tenantId,
          resource: options.resource,
          action: options.action,
          reason: result.reason,
        });
        throw new AuthorizationError(message);
      }

      // Attach permission result to request for potential use in handlers
      (req as any).permissionResult = result;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        next(error);
      } else {
        logger.error('Authorization middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          resource: options.resource,
          action: options.action,
        });
        next(new AuthorizationError('Authorization check failed'));
      }
    }
  };
}

/**
 * Middleware factory that checks if user has ANY of the specified permissions
 */
export function authorizeAny(permissions: Array<{ resource: string; action: string }>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      if (!tenantId) {
        throw new AuthorizationError('User does not belong to a tenant');
      }

      // Check each permission until one passes
      const results = await accessControl.checkPermissions(
        permissions.map(p => ({
          tenantId,
          userId,
          resource: p.resource,
          action: p.action,
        }))
      );

      const allowed = results.some(r => r.allowed);

      if (!allowed) {
        const permissionList = permissions
          .map(p => `${p.resource}.${p.action}`)
          .join(' or ');

        logger.warn('Authorization failed (any check)', {
          userId,
          tenantId,
          requiredPermissions: permissionList,
        });

        throw new AuthorizationError(
          `Requires one of the following permissions: ${permissionList}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        next(error);
      } else {
        logger.error('AuthorizeAny middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(new AuthorizationError('Authorization check failed'));
      }
    }
  };
}

/**
 * Middleware factory that checks if user has ALL of the specified permissions
 */
export function authorizeAll(permissions: Array<{ resource: string; action: string }>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      if (!tenantId) {
        throw new AuthorizationError('User does not belong to a tenant');
      }

      // Check all permissions
      const results = await accessControl.checkPermissions(
        permissions.map(p => ({
          tenantId,
          userId,
          resource: p.resource,
          action: p.action,
        }))
      );

      const allAllowed = results.every(r => r.allowed);

      if (!allAllowed) {
        const deniedPermissions = results
          .filter(r => !r.allowed)
          .map((r, i) => `${permissions[i].resource}.${permissions[i].action}`)
          .join(', ');

        logger.warn('Authorization failed (all check)', {
          userId,
          tenantId,
          deniedPermissions,
        });

        throw new AuthorizationError(
          `Missing required permissions: ${deniedPermissions}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        next(error);
      } else {
        logger.error('AuthorizeAll middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(new AuthorizationError('Authorization check failed'));
      }
    }
  };
}

/**
 * Helper to check permissions programmatically within handlers
 *
 * Usage in route handlers:
 *   const canUpdate = await checkPermission(req, 'staff', 'update', { targetUserId: staffId });
 *   if (!canUpdate.allowed) {
 *     return res.status(403).json({ error: canUpdate.reason });
 *   }
 */
export async function checkPermission(
  req: AuthRequest,
  resource: string,
  action: string,
  context?: PermissionCheckInput['context']
) {
  if (!req.user?.tenantId || !req.user?.id) {
    return {
      allowed: false,
      reason: 'User not authenticated or missing tenant',
    };
  }

  return accessControl.checkPermission({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    resource,
    action,
    context,
  });
}
