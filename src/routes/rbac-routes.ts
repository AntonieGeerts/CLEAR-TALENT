/**
 * RBAC Routes
 *
 * Role and permission management for access control system.
 * Supports creating custom roles, assigning permissions, and managing role lifecycle.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { tenantContext } from '../middleware/tenant-context';
import { asyncHandler } from '../middleware/error-handler';
import { RoleService } from '../services/access-control';
import { AuthRequest, ValidationError } from '../types';
import { Response } from 'express';

const router = Router();
const roleService = new RoleService();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext());

/**
 * GET /api/v1/rbac/roles
 * List all roles for tenant (includes system roles)
 */
router.get(
  '/roles',
  authorize({ resource: 'role', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;

    const roles = await roleService.listRoles(tenantId);

    res.json({
      success: true,
      data: roles,
    });
  })
);

/**
 * POST /api/v1/rbac/roles
 * Create a new custom role
 *
 * Body: {
 *   name: string,
 *   key: string,
 *   description?: string,
 *   permissions?: Array<{ permissionId: string, scope?: PermissionScope }>
 * }
 */
router.post(
  '/roles',
  authorize({ resource: 'role', action: 'create' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { name, key, description, permissions } = req.body;

    // Validation
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Role name is required');
    }

    if (!key || typeof key !== 'string') {
      throw new ValidationError('Role key is required');
    }

    const role = await roleService.createRole({
      tenantId,
      name,
      key,
      description,
      permissions,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    });
  })
);

/**
 * GET /api/v1/rbac/roles/:roleId
 * Get role details with permissions
 */
router.get(
  '/roles/:roleId',
  authorize({ resource: 'role', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { roleId } = req.params;

    const role = await roleService.getRoleById(roleId, tenantId);

    res.json({
      success: true,
      data: role,
    });
  })
);

/**
 * PUT /api/v1/rbac/roles/:roleId
 * Update role name and description (custom roles only)
 *
 * Body: {
 *   name?: string,
 *   description?: string
 * }
 */
router.put(
  '/roles/:roleId',
  authorize({ resource: 'role', action: 'update' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { roleId } = req.params;
    const { name, description } = req.body;

    const role = await roleService.updateRole({
      roleId,
      tenantId,
      name,
      description,
      updatedBy: userId,
    });

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully',
    });
  })
);

/**
 * DELETE /api/v1/rbac/roles/:roleId
 * Delete a custom role (only if not assigned to any members)
 */
router.delete(
  '/roles/:roleId',
  authorize({ resource: 'role', action: 'delete' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { roleId } = req.params;

    await roleService.deleteRole(roleId, tenantId, userId);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  })
);

/**
 * PUT /api/v1/rbac/roles/:roleId/permissions
 * Assign permissions to a role (replaces existing permissions)
 *
 * Body: {
 *   permissions: Array<{ permissionId: string, scope?: PermissionScope }>
 * }
 */
router.put(
  '/roles/:roleId/permissions',
  authorize({ resource: 'role', action: 'manage' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      throw new ValidationError('Permissions must be an array');
    }

    const role = await roleService.assignPermissions({
      roleId,
      tenantId,
      permissions,
      updatedBy: userId,
    });

    res.json({
      success: true,
      data: role,
      message: 'Role permissions updated successfully',
    });
  })
);

/**
 * GET /api/v1/rbac/permissions
 * List all available permissions
 */
router.get(
  '/permissions',
  authorize({ resource: 'role', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const permissions = await roleService.getAllPermissions();

    res.json({
      success: true,
      data: permissions,
    });
  })
);

/**
 * GET /api/v1/rbac/permissions/by-resource
 * Get permissions grouped by resource
 */
router.get(
  '/permissions/by-resource',
  authorize({ resource: 'role', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const permissions = await roleService.getPermissionsByResource();

    res.json({
      success: true,
      data: permissions,
    });
  })
);

export default router;
