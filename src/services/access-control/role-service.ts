/**
 * Role Service
 *
 * Manages roles and permissions for multi-tenant RBAC system.
 *
 * Features:
 * - Create custom roles per tenant
 * - Assign permissions to roles with scopes
 * - List system and tenant roles
 * - Update role permissions
 * - Role validation
 *
 * Usage:
 *   const roleService = new RoleService();
 *   const role = await roleService.createRole({
 *     tenantId: 'tenant-123',
 *     name: 'Department Manager',
 *     key: 'DEPT_MANAGER',
 *     description: 'Manages a specific department',
 *     permissions: [
 *       { permissionId: 'perm-1', scope: 'TEAM' },
 *       { permissionId: 'perm-2', scope: 'ORG' }
 *     ]
 *   });
 */

import { PrismaClient, PermissionScope } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AuditService, AuditEventTypes } from './audit-service';

const prisma = new PrismaClient();

export interface CreateRoleInput {
  tenantId: string;
  name: string;
  key: string;
  description?: string;
  permissions?: Array<{
    permissionId: string;
    scope?: PermissionScope;
  }>;
  createdBy: string; // userId for audit
}

export interface UpdateRoleInput {
  roleId: string;
  tenantId: string;
  name?: string;
  description?: string;
  updatedBy: string; // userId for audit
}

export interface AssignPermissionsInput {
  roleId: string;
  tenantId: string;
  permissions: Array<{
    permissionId: string;
    scope?: PermissionScope;
  }>;
  updatedBy: string; // userId for audit
}

export interface RoleWithPermissions {
  id: string;
  tenantId: string | null;
  name: string;
  key: string;
  description: string | null;
  isSystemDefault: boolean;
  isEditable: boolean;
  permissions: Array<{
    id: string;
    permissionKey: string;
    permissionName: string;
    resource: string;
    action: string;
    scope: PermissionScope | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class RoleService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Create a new custom role for a tenant
   */
  async createRole(input: CreateRoleInput): Promise<RoleWithPermissions> {
    const { tenantId, name, key, description, permissions, createdBy } = input;

    try {
      // Check if role key already exists for this tenant
      const existing = await prisma.role.findFirst({
        where: {
          tenantId,
          key,
        },
      });

      if (existing) {
        throw new Error(`Role with key '${key}' already exists for this tenant`);
      }

      // Create role with permissions in a transaction
      const role = await prisma.$transaction(async (tx) => {
        // Create the role
        const newRole = await tx.role.create({
          data: {
            tenantId,
            name,
            key,
            description,
            isSystemDefault: false,
            isEditable: true,
          },
        });

        // Add permissions if provided
        if (permissions && permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map(p => ({
              tenantId,
              roleId: newRole.id,
              permissionId: p.permissionId,
              scope: p.scope || null,
            })),
          });
        }

        return newRole;
      });

      // Log audit event
      await this.auditService.logRoleEvent(
        AuditEventTypes.ROLE_CREATED,
        tenantId,
        createdBy,
        role.id,
        {
          name,
          key,
          permissionCount: permissions?.length || 0,
        }
      );

      logger.info('Role created', { roleId: role.id, tenantId, name });

      // Return role with permissions
      return this.getRoleById(role.id, tenantId);
    } catch (error) {
      logger.error('Failed to create role', { error, input });
      throw error;
    }
  }

  /**
   * Get a role by ID with all permissions
   */
  async getRoleById(roleId: string, tenantId: string): Promise<RoleWithPermissions> {
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenantId },
          { tenantId: null }, // System roles
        ],
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    return this.mapRoleToOutput(role);
  }

  /**
   * List all roles for a tenant (including system roles)
   */
  async listRoles(tenantId: string): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }, // Include system roles
        ],
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: [
        { isSystemDefault: 'desc' }, // System roles first
        { name: 'asc' },
      ],
    });

    return roles.map(r => this.mapRoleToOutput(r));
  }

  /**
   * Update a role (only custom roles can be updated)
   */
  async updateRole(input: UpdateRoleInput): Promise<RoleWithPermissions> {
    const { roleId, tenantId, name, description, updatedBy } = input;

    try {
      // Verify role exists and is editable
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          tenantId, // Must be a tenant role, not system role
        },
      });

      if (!role) {
        throw new Error(`Role not found or not accessible: ${roleId}`);
      }

      if (!role.isEditable) {
        throw new Error(`Role '${role.name}' is not editable`);
      }

      // Update role
      await prisma.role.update({
        where: { id: roleId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      // Log audit event
      await this.auditService.logRoleEvent(
        AuditEventTypes.ROLE_UPDATED,
        tenantId,
        updatedBy,
        roleId,
        {
          changes: { name, description },
        }
      );

      logger.info('Role updated', { roleId, tenantId });

      return this.getRoleById(roleId, tenantId);
    } catch (error) {
      logger.error('Failed to update role', { error, input });
      throw error;
    }
  }

  /**
   * Assign permissions to a role (replaces existing permissions)
   */
  async assignPermissions(input: AssignPermissionsInput): Promise<RoleWithPermissions> {
    const { roleId, tenantId, permissions, updatedBy } = input;

    try {
      // Verify role exists and is editable
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      if (!role.isEditable) {
        throw new Error(`Role '${role.name}' permissions cannot be modified`);
      }

      // Validate all permissions exist
      const permissionIds = permissions.map(p => p.permissionId);
      const validPermissions = await prisma.permission.findMany({
        where: {
          id: { in: permissionIds },
        },
      });

      if (validPermissions.length !== permissionIds.length) {
        throw new Error('One or more permissions not found');
      }

      // Replace permissions in transaction
      await prisma.$transaction(async (tx) => {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Add new permissions
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map(p => ({
              tenantId,
              roleId,
              permissionId: p.permissionId,
              scope: p.scope || null,
            })),
          });
        }
      });

      // Log audit event
      await this.auditService.logRoleEvent(
        AuditEventTypes.ROLE_PERMISSIONS_UPDATED,
        tenantId,
        updatedBy,
        roleId,
        {
          permissionCount: permissions.length,
          permissionIds,
        }
      );

      logger.info('Role permissions updated', { roleId, tenantId, count: permissions.length });

      return this.getRoleById(roleId, tenantId);
    } catch (error) {
      logger.error('Failed to assign permissions', { error, input });
      throw error;
    }
  }

  /**
   * Delete a custom role
   */
  async deleteRole(roleId: string, tenantId: string, deletedBy: string): Promise<void> {
    try {
      // Verify role exists and is deletable
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          tenantId,
        },
      });

      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      if (!role.isEditable) {
        throw new Error(`Role '${role.name}' cannot be deleted`);
      }

      // Check if role is assigned to any members
      const memberCount = await prisma.tenantUserMembership.count({
        where: {
          OR: [
            { primaryRoleId: roleId },
            { additionalRoleIds: { has: roleId } },
          ],
        },
      });

      if (memberCount > 0) {
        throw new Error(`Cannot delete role '${role.name}' - it is assigned to ${memberCount} member(s)`);
      }

      // Delete role (permissions will cascade)
      await prisma.role.delete({
        where: { id: roleId },
      });

      // Log audit event
      await this.auditService.logRoleEvent(
        AuditEventTypes.ROLE_DELETED,
        tenantId,
        deletedBy,
        roleId,
        {
          name: role.name,
          key: role.key,
        }
      );

      logger.info('Role deleted', { roleId, tenantId });
    } catch (error) {
      logger.error('Failed to delete role', { error, roleId, tenantId });
      throw error;
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Array<{
    id: string;
    key: string;
    resource: string;
    action: string;
    description: string | null;
  }>> {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    return permissions.map(p => ({
      id: p.id,
      key: p.key,
      resource: p.resource,
      action: p.action,
      description: p.description,
    }));
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsByResource(): Promise<Record<string, Array<{
    id: string;
    key: string;
    action: string;
    description: string | null;
  }>>> {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    const grouped: Record<string, any[]> = {};

    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push({
        id: perm.id,
        key: perm.key,
        action: perm.action,
        description: perm.description,
      });
    }

    return grouped;
  }

  /**
   * Map database role to output format
   */
  private mapRoleToOutput(role: any): RoleWithPermissions {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      key: role.key,
      description: role.description,
      isSystemDefault: role.isSystemDefault,
      isEditable: role.isEditable,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.id,
        permissionKey: rp.permission.key,
        permissionName: `${rp.permission.resource}.${rp.permission.action}`,
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.scope,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

export default RoleService;
