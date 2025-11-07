/**
 * Tenant Service
 *
 * Manages tenant lifecycle, settings, and organizational configuration.
 *
 * Features:
 * - Create and manage tenant organizations
 * - Tenant settings and branding configuration
 * - Subscription plan management
 * - Tenant activation/deactivation
 * - Member statistics and reporting
 * - Onboarding status tracking
 *
 * Usage:
 *   const tenantService = new TenantService();
 *   const tenant = await tenantService.createTenant({
 *     name: 'Acme Corp',
 *     slug: 'acme',
 *     plan: 'PRO',
 *     adminEmail: 'admin@acme.com',
 *     adminPassword: 'secure-password'
 *   });
 */

import { PrismaClient, TenantPlan, MembershipStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AuditService, AuditEventTypes } from './audit-service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: TenantPlan;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  settings?: Record<string, any>;
  logo?: string;
  primaryColor?: string;
}

export interface UpdateTenantInput {
  tenantId: string;
  name?: string;
  logo?: string;
  primaryColor?: string;
  updatedBy: string; // userId for audit
}

export interface UpdateTenantSettingsInput {
  tenantId: string;
  settings: Record<string, any>;
  updatedBy: string; // userId for audit
}

export interface UpdateTenantPlanInput {
  tenantId: string;
  plan: TenantPlan;
  updatedBy: string; // userId for audit
}

export interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  isActive: boolean;
  onboardingStatus: string;
  logo: string | null;
  primaryColor: string | null;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalMembers: number;
    activeMembers: number;
    suspendedMembers: number;
    pendingInvitations: number;
    customRoles: number;
  };
}

export interface ListTenantsQuery {
  plan?: TenantPlan;
  isActive?: boolean;
  search?: string; // Search by name or slug
  limit?: number;
  offset?: number;
}

export class TenantService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Create a new tenant with admin user
   */
  async createTenant(input: CreateTenantInput): Promise<TenantWithStats> {
    const {
      name,
      slug,
      plan = TenantPlan.BASIC,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      settings = {},
      logo,
      primaryColor,
    } = input;

    try {
      // Check if slug is already taken
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        throw new Error(`Tenant slug '${slug}' is already taken`);
      }

      // Check if admin email is already used
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingUser) {
        throw new Error(`User with email ${adminEmail} already exists`);
      }

      // Hash admin password
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // Get ADMIN role (system default)
      const adminRole = await prisma.role.findFirst({
        where: {
          key: 'ADMIN',
          tenantId: null, // System role
        },
      });

      if (!adminRole) {
        throw new Error('ADMIN role not found in system');
      }

      // Create tenant with admin user and membership in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name,
            slug,
            plan,
            settings,
            logo,
            primaryColor,
            isActive: true,
            onboardingStatus: 'in_progress',
          },
        });

        // Create admin user
        const adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            firstName: adminFirstName,
            lastName: adminLastName,
            role: 'ADMIN', // Legacy field
            tenantId: tenant.id,
          },
        });

        // Create membership for admin
        await tx.tenantUserMembership.create({
          data: {
            tenantId: tenant.id,
            userId: adminUser.id,
            primaryRoleId: adminRole.id,
            status: MembershipStatus.ACTIVE,
            metadata: {
              position: 'Administrator',
              isOwner: true,
            },
          },
        });

        return { tenant, adminUser };
      });

      logger.info('Tenant created', {
        tenantId: result.tenant.id,
        name: result.tenant.name,
        adminUserId: result.adminUser.id,
      });

      // Get tenant with stats
      return this.getTenantWithStats(result.tenant.id);
    } catch (error) {
      logger.error('Failed to create tenant', { error, input });
      throw error;
    }
  }

  /**
   * Get tenant by ID with statistics
   */
  async getTenantWithStats(tenantId: string): Promise<TenantWithStats> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Get member statistics
    const [
      totalMembers,
      activeMembers,
      suspendedMembers,
      pendingInvitations,
      customRoles,
    ] = await Promise.all([
      prisma.tenantUserMembership.count({
        where: { tenantId },
      }),
      prisma.tenantUserMembership.count({
        where: { tenantId, status: MembershipStatus.ACTIVE },
      }),
      prisma.tenantUserMembership.count({
        where: { tenantId, status: MembershipStatus.SUSPENDED },
      }),
      prisma.invitation.count({
        where: { tenantId, status: 'PENDING' },
      }),
      prisma.role.count({
        where: { tenantId, isSystemDefault: false },
      }),
    ]);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      isActive: tenant.isActive,
      onboardingStatus: tenant.onboardingStatus,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      settings: tenant.settings as Record<string, any>,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      stats: {
        totalMembers,
        activeMembers,
        suspendedMembers,
        pendingInvitations,
        customRoles,
      },
    };
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<TenantWithStats> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new Error(`Tenant not found with slug: ${slug}`);
    }

    return this.getTenantWithStats(tenant.id);
  }

  /**
   * Update tenant basic information
   */
  async updateTenant(input: UpdateTenantInput): Promise<TenantWithStats> {
    const { tenantId, name, logo, primaryColor, updatedBy } = input;

    try {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      // Update tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(name && { name }),
          ...(logo !== undefined && { logo }),
          ...(primaryColor !== undefined && { primaryColor }),
        },
      });

      // Log audit event
      await this.auditService.log({
        tenantId,
        actorUserId: updatedBy,
        eventType: AuditEventTypes.TENANT_SETTINGS_UPDATED,
        resourceType: 'tenant',
        resourceId: tenantId,
        metadata: {
          changes: { name, logo, primaryColor },
        },
      });

      logger.info('Tenant updated', { tenantId, name });

      return this.getTenantWithStats(tenantId);
    } catch (error) {
      logger.error('Failed to update tenant', { error, input });
      throw error;
    }
  }

  /**
   * Update tenant settings
   */
  async updateTenantSettings(
    input: UpdateTenantSettingsInput
  ): Promise<TenantWithStats> {
    const { tenantId, settings, updatedBy } = input;

    try {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      // Merge with existing settings
      const currentSettings = tenant.settings as Record<string, any>;
      const mergedSettings = { ...currentSettings, ...settings };

      // Update tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { settings: mergedSettings },
      });

      // Log audit event
      await this.auditService.log({
        tenantId,
        actorUserId: updatedBy,
        eventType: AuditEventTypes.TENANT_SETTINGS_UPDATED,
        resourceType: 'tenant',
        resourceId: tenantId,
        metadata: {
          updatedSettings: Object.keys(settings),
        },
      });

      logger.info('Tenant settings updated', { tenantId });

      return this.getTenantWithStats(tenantId);
    } catch (error) {
      logger.error('Failed to update tenant settings', { error, input });
      throw error;
    }
  }

  /**
   * Update tenant subscription plan
   */
  async updateTenantPlan(
    input: UpdateTenantPlanInput
  ): Promise<TenantWithStats> {
    const { tenantId, plan, updatedBy } = input;

    try {
      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const oldPlan = tenant.plan;

      // Update tenant plan
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan },
      });

      // Log audit event
      await this.auditService.log({
        tenantId,
        actorUserId: updatedBy,
        eventType: AuditEventTypes.TENANT_PLAN_CHANGED,
        resourceType: 'tenant',
        resourceId: tenantId,
        metadata: {
          oldPlan,
          newPlan: plan,
        },
      });

      logger.info('Tenant plan updated', { tenantId, oldPlan, newPlan: plan });

      return this.getTenantWithStats(tenantId);
    } catch (error) {
      logger.error('Failed to update tenant plan', { error, input });
      throw error;
    }
  }

  /**
   * Activate tenant
   */
  async activateTenant(
    tenantId: string,
    activatedBy: string
  ): Promise<TenantWithStats> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: activatedBy,
      eventType: 'tenant.activated',
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: {},
    });

    logger.info('Tenant activated', { tenantId });

    return this.getTenantWithStats(tenantId);
  }

  /**
   * Deactivate tenant
   */
  async deactivateTenant(
    tenantId: string,
    deactivatedBy: string
  ): Promise<TenantWithStats> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: deactivatedBy,
      eventType: 'tenant.deactivated',
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: {},
    });

    logger.info('Tenant deactivated', { tenantId });

    return this.getTenantWithStats(tenantId);
  }

  /**
   * Update onboarding status
   */
  async updateOnboardingStatus(
    tenantId: string,
    status: 'pending' | 'in_progress' | 'completed',
    updatedBy: string
  ): Promise<TenantWithStats> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingStatus: status },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: updatedBy,
      eventType: 'tenant.onboarding_updated',
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: { status },
    });

    logger.info('Tenant onboarding status updated', { tenantId, status });

    return this.getTenantWithStats(tenantId);
  }

  /**
   * List all tenants (for system admins)
   */
  async listTenants(query: ListTenantsQuery): Promise<{
    tenants: TenantWithStats[];
    total: number;
    hasMore: boolean;
  }> {
    const { plan, isActive, search, limit = 50, offset = 0 } = query;

    const where: any = {};

    if (plan) {
      where.plan = plan;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.tenant.count({ where }),
    ]);

    // Get stats for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map((tenant) => this.getTenantWithStats(tenant.id))
    );

    return {
      tenants: tenantsWithStats,
      total,
      hasMore: offset + tenants.length < total,
    };
  }

  /**
   * Delete tenant (DANGEROUS - only for system admins)
   * This will cascade delete all related data
   */
  async deleteTenant(tenantId: string, deletedBy: string): Promise<void> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      // Log audit event before deletion
      await this.auditService.log({
        tenantId,
        actorUserId: deletedBy,
        eventType: 'tenant.deleted',
        resourceType: 'tenant',
        resourceId: tenantId,
        metadata: {
          name: tenant.name,
          slug: tenant.slug,
        },
      });

      // Delete tenant (cascades to all related data)
      await prisma.tenant.delete({
        where: { id: tenantId },
      });

      logger.info('Tenant deleted', { tenantId, name: tenant.name });
    } catch (error) {
      logger.error('Failed to delete tenant', { error, tenantId });
      throw error;
    }
  }
}

export default TenantService;
