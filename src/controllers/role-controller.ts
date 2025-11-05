import { Response } from 'express';
import { AuthRequest } from '../types';
import { RoleTemplateService } from '../services/role/role-template-service';

export class RoleController {
  /**
   * Create role profile
   */
  static async create(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const roleProfile = await RoleTemplateService.createRoleProfile(
      tenantId,
      userId,
      req.body
    );

    res.status(201).json({
      success: true,
      data: roleProfile,
      message: 'Role profile created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * List role profiles
   */
  static async list(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    const result = await RoleTemplateService.listRoleProfiles(tenantId, {
      department: req.query.department as string,
      seniority: req.query.seniority as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    });

    res.json({
      success: true,
      data: result.roleProfiles,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get role profile by ID
   */
  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const roleProfile = await RoleTemplateService.getRoleProfileById(id, tenantId);

    res.json({
      success: true,
      data: roleProfile,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update role profile (creates new version)
   */
  static async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const roleProfile = await RoleTemplateService.updateRoleProfile(
      id,
      tenantId,
      userId,
      req.body
    );

    res.json({
      success: true,
      data: roleProfile,
      message: 'Role profile updated successfully (new version created)',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete role profile
   */
  static async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    await RoleTemplateService.deleteRoleProfile(id, tenantId);

    res.json({
      success: true,
      message: 'Role profile deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Clone role profile
   */
  static async clone(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { newTitle } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    if (!newTitle) {
      return res.status(400).json({
        success: false,
        error: 'newTitle is required',
      });
    }

    const cloned = await RoleTemplateService.cloneRoleProfile(
      id,
      tenantId,
      userId,
      newTitle
    );

    res.json({
      success: true,
      data: cloned,
      message: 'Role profile cloned successfully',
      timestamp: new Date().toISOString(),
    });
  }
}

export default RoleController;
