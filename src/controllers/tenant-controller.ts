import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { ValidationError, AuthorizationError } from '../types';

const prisma = new PrismaClient();

export class TenantController {
  /**
   * Get all tenants (SYSTEM_ADMIN only)
   */
  static async getAllTenants(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can access this resource');
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              competencies: true,
              reviewCycles: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get single tenant details (SYSTEM_ADMIN only)
   */
  static async getTenant(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can access this resource');
    }

    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            competencies: true,
            roleProfiles: true,
            reviewCycles: true,
            organizationalGoals: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
      });
    }

    res.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create new tenant (SYSTEM_ADMIN only)
   */
  static async createTenant(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can create tenants');
    }

    const {
      name,
      slug,
      settings = {},
      logo,
      primaryColor,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPassword,
    } = req.body;

    if (!name || !slug) {
      throw new ValidationError('Tenant name and slug are required');
    }

    if (!adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      throw new ValidationError('Admin user details are required');
    }

    // Check if slug is already taken
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ValidationError('Tenant slug already exists');
    }

    // Check if admin email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      throw new ValidationError('Admin email already exists');
    }

    // Create tenant and admin user in transaction
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        settings,
        logo,
        primaryColor,
        onboardingStatus: 'in_progress',
        users: {
          create: {
            email: adminEmail,
            firstName: adminFirstName,
            lastName: adminLastName,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update tenant (SYSTEM_ADMIN only)
   */
  static async updateTenant(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can update tenants');
    }

    const { id } = req.params;
    const {
      name,
      settings,
      isActive,
      onboardingStatus,
      logo,
      primaryColor,
    } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(settings && { settings }),
        ...(isActive !== undefined && { isActive }),
        ...(onboardingStatus && { onboardingStatus }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor && { primaryColor }),
      },
    });

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Deactivate tenant (SYSTEM_ADMIN only)
   */
  static async deactivateTenant(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can deactivate tenants');
    }

    const { id } = req.params;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant deactivated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get tenant statistics (SYSTEM_ADMIN only)
   */
  static async getTenantStats(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      throw new AuthorizationError('Only system administrators can access statistics');
    }

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: { not: 'SYSTEM_ADMIN' } } }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          onboardingStatus: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        recentTenants,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
