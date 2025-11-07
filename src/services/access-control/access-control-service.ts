/**
 * Access Control Service
 *
 * Core RBAC permission evaluation engine for multi-tenant access control.
 *
 * Features:
 * - Permission checking with scope evaluation (SELF, TEAM, ORG)
 * - Role resolution with primary + additional roles support
 * - Membership status validation
 * - Caching for performance optimization
 * - Comprehensive audit trail
 *
 * Usage:
 *   const accessControl = new AccessControlService();
 *   const canManageStaff = await accessControl.checkPermission({
 *     tenantId: 'tenant-123',
 *     userId: 'user-456',
 *     resource: 'staff',
 *     action: 'manage',
 *     context: { targetUserId: 'user-789' }
 *   });
 */

import { PrismaClient, PermissionScope, MembershipStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface PermissionCheckInput {
  tenantId: string;
  userId: string;
  resource: string;
  action: string;
  context?: {
    targetUserId?: string;
    targetDepartment?: string;
    targetTeam?: string;
    [key: string]: any;
  };
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPermission?: {
    key: string;
    scope?: PermissionScope | null;
    roleName: string;
  };
}

export interface MembershipInfo {
  id: string;
  tenantId: string;
  userId: string;
  primaryRoleId: string;
  additionalRoleIds: string[];
  status: MembershipStatus;
  metadata: Record<string, any>;
}

export interface RoleInfo {
  id: string;
  name: string;
  key: string;
  permissions: Array<{
    key: string;
    resource: string;
    action: string;
    scope: PermissionScope | null;
  }>;
}

export class AccessControlService {
  private membershipCache = new Map<string, MembershipInfo>();
  private roleCache = new Map<string, RoleInfo>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user has permission to perform an action on a resource
   */
  async checkPermission(input: PermissionCheckInput): Promise<PermissionCheckResult> {
    const { tenantId, userId, resource, action, context } = input;

    try {
      // 1. Get active membership
      const membership = await this.getMembership(tenantId, userId);
      if (!membership) {
        return {
          allowed: false,
          reason: 'No active membership found for user in this tenant',
        };
      }

      if (membership.status !== MembershipStatus.ACTIVE) {
        return {
          allowed: false,
          reason: `Membership status is ${membership.status}, expected ACTIVE`,
        };
      }

      // 2. Get all roles for user (primary + additional)
      const roleIds = [membership.primaryRoleId, ...membership.additionalRoleIds];
      const roles = await Promise.all(roleIds.map(id => this.getRole(id)));

      // 3. Check each role's permissions
      const permissionKey = `${resource}.${action}`;

      for (const role of roles) {
        if (!role) continue;

        for (const permission of role.permissions) {
          if (permission.key === permissionKey) {
            // Found matching permission, now check scope
            const scopeAllowed = await this.evaluateScope(
              permission.scope,
              membership,
              context
            );

            if (scopeAllowed) {
              logger.info('Permission granted', {
                tenantId,
                userId,
                resource,
                action,
                roleName: role.name,
                scope: permission.scope,
              });

              return {
                allowed: true,
                matchedPermission: {
                  key: permission.key,
                  scope: permission.scope,
                  roleName: role.name,
                },
              };
            }
          }
        }
      }

      // No matching permission found
      logger.warn('Permission denied', {
        tenantId,
        userId,
        resource,
        action,
        reason: 'No matching permission found in user roles',
      });

      return {
        allowed: false,
        reason: `Permission '${permissionKey}' not granted by any role`,
      };

    } catch (error) {
      logger.error('Error checking permission', { error, tenantId, userId, resource, action });
      return {
        allowed: false,
        reason: 'Internal error during permission check',
      };
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(
    inputs: PermissionCheckInput[]
  ): Promise<PermissionCheckResult[]> {
    return Promise.all(inputs.map(input => this.checkPermission(input)));
  }

  /**
   * Get user's membership in a tenant with caching
   */
  private async getMembership(
    tenantId: string,
    userId: string
  ): Promise<MembershipInfo | null> {
    const cacheKey = `${tenantId}:${userId}`;
    const cached = this.membershipCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const membership = await prisma.tenantUserMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (membership) {
      const membershipInfo: MembershipInfo = {
        id: membership.id,
        tenantId: membership.tenantId,
        userId: membership.userId,
        primaryRoleId: membership.primaryRoleId,
        additionalRoleIds: membership.additionalRoleIds,
        status: membership.status,
        metadata: membership.metadata as Record<string, any>,
      };

      this.membershipCache.set(cacheKey, membershipInfo);
      setTimeout(() => this.membershipCache.delete(cacheKey), this.cacheTimeout);

      return membershipInfo;
    }

    return null;
  }

  /**
   * Get role with permissions with caching
   */
  private async getRole(roleId: string): Promise<RoleInfo | null> {
    const cached = this.roleCache.get(roleId);

    if (cached) {
      return cached;
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (role) {
      const roleInfo: RoleInfo = {
        id: role.id,
        name: role.name,
        key: role.key,
        permissions: role.permissions.map(rp => ({
          key: rp.permission.key,
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.scope,
        })),
      };

      this.roleCache.set(roleId, roleInfo);
      setTimeout(() => this.roleCache.delete(roleId), this.cacheTimeout);

      return roleInfo;
    }

    return null;
  }

  /**
   * Evaluate permission scope against context
   */
  private async evaluateScope(
    scope: PermissionScope | null,
    membership: MembershipInfo,
    context?: PermissionCheckInput['context']
  ): Promise<boolean> {
    // No scope restriction means permission applies organization-wide
    if (!scope || scope === PermissionScope.ORG) {
      return true;
    }

    if (scope === PermissionScope.SELF) {
      // User can only access their own resources
      const targetUserId = context?.targetUserId;
      if (!targetUserId) {
        // If no target user specified, assume self
        return true;
      }
      return targetUserId === membership.userId;
    }

    if (scope === PermissionScope.TEAM) {
      // User can access resources in their team
      // This requires checking manager hierarchy or department/team metadata
      const targetUserId = context?.targetUserId;
      if (!targetUserId) {
        // If no target specified, allow (e.g., viewing team list)
        return true;
      }

      // Check if target user is in the same team/department
      const targetMembership = await this.getMembership(
        membership.tenantId,
        targetUserId
      );

      if (!targetMembership) {
        return false;
      }

      // Check manager relationship from metadata
      const isManager = targetMembership.metadata.managerId === membership.userId;
      if (isManager) {
        return true;
      }

      // Check same department/team
      const sameDepartment = membership.metadata.department === targetMembership.metadata.department;
      const sameTeam = membership.metadata.team === targetMembership.metadata.team;

      return sameDepartment || sameTeam;
    }

    return false;
  }

  /**
   * Clear all caches (useful for testing or after role changes)
   */
  clearCache(): void {
    this.membershipCache.clear();
    this.roleCache.clear();
  }

  /**
   * Get all permissions for a user (useful for UI permission checks)
   */
  async getUserPermissions(
    tenantId: string,
    userId: string
  ): Promise<Array<{ key: string; scope: PermissionScope | null }>> {
    const membership = await this.getMembership(tenantId, userId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      return [];
    }

    const roleIds = [membership.primaryRoleId, ...membership.additionalRoleIds];
    const roles = await Promise.all(roleIds.map(id => this.getRole(id)));

    const permissions = new Map<string, PermissionScope | null>();

    for (const role of roles) {
      if (!role) continue;

      for (const permission of role.permissions) {
        // If permission already exists with broader scope, keep it
        const existing = permissions.get(permission.key);
        if (existing === PermissionScope.ORG) {
          continue;
        }
        if (permission.scope === PermissionScope.ORG || !permission.scope) {
          permissions.set(permission.key, PermissionScope.ORG);
        } else if (existing === PermissionScope.TEAM) {
          continue;
        } else {
          permissions.set(permission.key, permission.scope);
        }
      }
    }

    return Array.from(permissions.entries()).map(([key, scope]) => ({ key, scope }));
  }
}

export default AccessControlService;
