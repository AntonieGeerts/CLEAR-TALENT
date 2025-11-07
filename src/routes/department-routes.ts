/**
 * Department Routes
 *
 * Department management for multi-tenant system.
 * Supports creating, updating, deleting, and listing departments with hierarchical structure.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { tenantContext } from '../middleware/tenant-context';
import { asyncHandler } from '../middleware/error-handler';
import { DepartmentService } from '../services/access-control';
import { AuthRequest, ValidationError } from '../types';
import { Response } from 'express';

const router = Router();
const departmentService = new DepartmentService();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext());

/**
 * GET /api/v1/departments
 * List departments for tenant with optional filtering
 *
 * Query params:
 *   - isActive: boolean (optional)
 *   - parentId: string | 'null' for top-level (optional)
 *   - search: string (optional)
 */
router.get(
  '/',
  authorize({ resource: 'department', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { isActive, parentId, search } = req.query;

    const result = await departmentService.listDepartments({
      tenantId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      parentId: parentId === 'null' ? null : (parentId as string | undefined),
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/v1/departments/hierarchy
 * Get department hierarchy (top-level departments with nested children)
 */
router.get(
  '/hierarchy',
  authorize({ resource: 'department', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;

    const hierarchy = await departmentService.getDepartmentHierarchy(tenantId);

    res.json({
      success: true,
      data: hierarchy,
    });
  })
);

/**
 * GET /api/v1/departments/:id
 * Get department by ID
 */
router.get(
  '/:id',
  authorize({ resource: 'department', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    const department = await departmentService.getDepartmentById(id, tenantId);

    res.json({
      success: true,
      data: department,
    });
  })
);

/**
 * POST /api/v1/departments
 * Create a new department
 *
 * Body: {
 *   name: string,
 *   code?: string,
 *   description?: string,
 *   parentId?: string,
 *   managerId?: string,
 *   metadata?: Record<string, any>
 * }
 */
router.post(
  '/',
  authorize({ resource: 'department', action: 'create' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { name, code, description, parentId, managerId, metadata } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Department name is required');
    }

    const department = await departmentService.createDepartment({
      tenantId,
      name: name.trim(),
      code: code?.trim(),
      description: description?.trim(),
      parentId,
      managerId,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully',
    });
  })
);

/**
 * PUT /api/v1/departments/:id
 * Update a department
 *
 * Body: {
 *   name?: string,
 *   code?: string,
 *   description?: string,
 *   parentId?: string,
 *   managerId?: string,
 *   isActive?: boolean,
 *   metadata?: Record<string, any>
 * }
 */
router.put(
  '/:id',
  authorize({ resource: 'department', action: 'update' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;
    const { name, code, description, parentId, managerId, isActive, metadata } = req.body;

    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Department name cannot be empty');
      }
      updates.name = name.trim();
    }

    if (code !== undefined) updates.code = code?.trim() || null;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (parentId !== undefined) updates.parentId = parentId || null;
    if (managerId !== undefined) updates.managerId = managerId || null;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (metadata !== undefined) updates.metadata = metadata;

    const department = await departmentService.updateDepartment(id, tenantId, updates);

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully',
    });
  })
);

/**
 * DELETE /api/v1/departments/:id
 * Delete a department (soft delete - sets isActive to false)
 */
router.delete(
  '/:id',
  authorize({ resource: 'department', action: 'delete' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { id } = req.params;

    await departmentService.deleteDepartment(id, tenantId);

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  })
);

export default router;
