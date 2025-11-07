/**
 * Staff Service
 *
 * Manages staff invitations, memberships, and onboarding for multi-tenant system.
 *
 * Features:
 * - Invite staff with role assignments
 * - Accept invitations and create memberships
 * - List and filter staff members
 * - Update member roles and status
 * - Deactivate/suspend/reactivate members
 *
 * Usage:
 *   const staffService = new StaffService();
 *   const invitation = await staffService.inviteStaff({
 *     tenantId: 'tenant-123',
 *     email: 'newuser@example.com',
 *     roleIds: ['role-1', 'role-2'],
 *     invitedBy: 'user-456'
 *   });
 */

import { PrismaClient, MembershipStatus, InvitationStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AuditService, AuditEventTypes } from './audit-service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface InviteStaffInput {
  tenantId: string;
  email: string;
  roleIds: string[]; // At least one role ID required
  invitedBy: string; // userId
  expiresInDays?: number; // Default: 7 days
  metadata?: Record<string, any>; // department, manager, etc.
}

export interface AcceptInvitationInput {
  invitationToken: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateMembershipInput {
  membershipId: string;
  tenantId: string;
  primaryRoleId?: string;
  additionalRoleIds?: string[];
  status?: MembershipStatus;
  metadata?: Record<string, any>;
  updatedBy: string; // userId for audit
}

export interface ListStaffQuery {
  tenantId: string;
  status?: MembershipStatus;
  roleId?: string;
  department?: string;
  search?: string; // Search by name or email
  limit?: number;
  offset?: number;
}

export interface StaffMember {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: {
    id: string;
    name: string;
    key: string;
  };
  additionalRoles: Array<{
    id: string;
    name: string;
    key: string;
  }>;
  status: MembershipStatus;
  department?: string;
  position?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Invite a new staff member
   */
  async inviteStaff(input: InviteStaffInput): Promise<{
    invitationId: string;
    email: string;
    expiresAt: Date;
  }> {
    const { tenantId, email, roleIds, invitedBy, expiresInDays = 7, metadata } = input;

    try {
      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      // Validate roles exist and belong to tenant or are system roles
      if (roleIds.length === 0) {
        throw new Error('At least one role must be specified');
      }

      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds },
          OR: [
            { tenantId },
            { tenantId: null }, // System roles
          ],
        },
      });

      if (roles.length !== roleIds.length) {
        throw new Error('One or more roles not found or not accessible');
      }

      // Check if user already exists for this tenant
      const existingMembership = await prisma.tenantUserMembership.findFirst({
        where: {
          tenantId,
          user: {
            email,
          },
        },
      });

      if (existingMembership) {
        throw new Error(`User with email ${email} is already a member of this tenant`);
      }

      // Check for pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          tenantId,
          email,
          status: InvitationStatus.PENDING,
        },
      });

      if (existingInvitation) {
        throw new Error(`Pending invitation already exists for ${email}`);
      }

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const invitation = await prisma.invitation.create({
        data: {
          tenantId,
          email,
          invitedByUserId: invitedBy,
          roleIds,
          status: InvitationStatus.PENDING,
          expiresAt,
        },
      });

      // Log audit event
      await this.auditService.log({
        tenantId,
        actorUserId: invitedBy,
        eventType: AuditEventTypes.STAFF_INVITED,
        resourceType: 'invitation',
        resourceId: invitation.id,
        metadata: {
          email,
          roleIds,
          expiresAt,
        },
      });

      logger.info('Staff invited', { invitationId: invitation.id, email, tenantId });

      // TODO: Send invitation email (implement email service separately)

      return {
        invitationId: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to invite staff', { error, input });
      throw error;
    }
  }

  /**
   * Accept an invitation and create user/membership
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<{
    userId: string;
    membershipId: string;
  }> {
    const { invitationToken, email, password, firstName, lastName } = input;

    try {
      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationToken },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.email !== email) {
        throw new Error('Email does not match invitation');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error(`Invitation status is ${invitation.status}, expected PENDING`);
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user and membership in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Check if user already exists globally
        let user = await tx.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, just create membership
          // Verify they don't already have a membership for this tenant
          const existing = await tx.tenantUserMembership.findUnique({
            where: {
              tenantId_userId: {
                tenantId: invitation.tenantId,
                userId: user.id,
              },
            },
          });

          if (existing) {
            throw new Error('User already has membership in this tenant');
          }
        } else {
          // Create new user
          user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName,
              role: 'EMPLOYEE', // Legacy field, will be deprecated
              tenantId: invitation.tenantId,
            },
          });
        }

        // Create membership with roles from invitation
        const membership = await tx.tenantUserMembership.create({
          data: {
            tenantId: invitation.tenantId,
            userId: user.id,
            primaryRoleId: invitation.roleIds[0], // First role is primary
            additionalRoleIds: invitation.roleIds.slice(1), // Rest are additional
            status: MembershipStatus.ACTIVE,
            metadata: {},
          },
        });

        // Mark invitation as accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
          },
        });

        return { user, membership };
      });

      // Log audit event
      await this.auditService.logStaffEvent(
        AuditEventTypes.STAFF_ACTIVATED,
        invitation.tenantId,
        result.user.id, // User activated themselves
        result.user.id,
        {
          email,
          roles: invitation.roleIds,
        }
      );

      logger.info('Invitation accepted', {
        userId: result.user.id,
        membershipId: result.membership.id,
        tenantId: invitation.tenantId,
      });

      return {
        userId: result.user.id,
        membershipId: result.membership.id,
      };
    } catch (error) {
      logger.error('Failed to accept invitation', { error, invitationToken });
      throw error;
    }
  }

  /**
   * List staff members for a tenant
   */
  async listStaff(query: ListStaffQuery): Promise<{
    members: StaffMember[];
    total: number;
    hasMore: boolean;
  }> {
    const { tenantId, status, roleId, department, search, limit = 50, offset = 0 } = query;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.OR = [
        { primaryRoleId: roleId },
        { additionalRoleIds: { has: roleId } },
      ];
    }

    if (department) {
      where.metadata = {
        path: ['department'],
        equals: department,
      };
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [memberships, total] = await Promise.all([
      prisma.tenantUserMembership.findMany({
        where,
        include: {
          user: true,
          primaryRole: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.tenantUserMembership.count({ where }),
    ]);

    // Fetch additional roles for each membership
    const members: StaffMember[] = [];

    for (const membership of memberships) {
      const additionalRoles = await prisma.role.findMany({
        where: {
          id: { in: membership.additionalRoleIds },
        },
      });

      members.push({
        membershipId: membership.id,
        userId: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        primaryRole: {
          id: membership.primaryRole.id,
          name: membership.primaryRole.name,
          key: membership.primaryRole.key,
        },
        additionalRoles: additionalRoles.map(r => ({
          id: r.id,
          name: r.name,
          key: r.key,
        })),
        status: membership.status,
        department: membership.user.department || undefined,
        position: membership.user.position || undefined,
        metadata: membership.metadata as Record<string, any>,
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      });
    }

    return {
      members,
      total,
      hasMore: offset + members.length < total,
    };
  }

  /**
   * Update a staff member's membership
   */
  async updateMembership(input: UpdateMembershipInput): Promise<StaffMember> {
    const { membershipId, tenantId, primaryRoleId, additionalRoleIds, status, metadata, updatedBy } = input;

    try {
      // Verify membership exists
      const membership = await prisma.tenantUserMembership.findFirst({
        where: {
          id: membershipId,
          tenantId,
        },
        include: {
          user: true,
        },
      });

      if (!membership) {
        throw new Error(`Membership not found: ${membershipId}`);
      }

      // If updating roles, validate they exist
      if (primaryRoleId || additionalRoleIds) {
        const roleIdsToCheck = [
          ...(primaryRoleId ? [primaryRoleId] : []),
          ...(additionalRoleIds || []),
        ];

        if (roleIdsToCheck.length > 0) {
          const roles = await prisma.role.findMany({
            where: {
              id: { in: roleIdsToCheck },
              OR: [
                { tenantId },
                { tenantId: null },
              ],
            },
          });

          if (roles.length !== roleIdsToCheck.length) {
            throw new Error('One or more roles not found');
          }
        }
      }

      // Update membership
      const updated = await prisma.tenantUserMembership.update({
        where: { id: membershipId },
        data: {
          ...(primaryRoleId && { primaryRoleId }),
          ...(additionalRoleIds && { additionalRoleIds }),
          ...(status && { status }),
          ...(metadata && { metadata }),
        },
      });

      // Log audit event
      const eventType = status
        ? status === MembershipStatus.SUSPENDED
          ? AuditEventTypes.STAFF_SUSPENDED
          : status === MembershipStatus.LEFT
          ? AuditEventTypes.STAFF_LEFT
          : AuditEventTypes.STAFF_UPDATED
        : AuditEventTypes.STAFF_UPDATED;

      await this.auditService.logStaffEvent(
        eventType,
        tenantId,
        updatedBy,
        membership.userId,
        {
          changes: { primaryRoleId, additionalRoleIds, status, metadata },
        }
      );

      logger.info('Membership updated', { membershipId, tenantId });

      // Return updated member
      const result = await this.listStaff({
        tenantId,
        limit: 1,
        offset: 0,
      });

      const member = result.members.find(m => m.membershipId === membershipId);
      if (!member) {
        throw new Error('Failed to retrieve updated membership');
      }

      return member;
    } catch (error) {
      logger.error('Failed to update membership', { error, input });
      throw error;
    }
  }

  /**
   * Deactivate a staff member
   */
  async deactivateStaff(
    membershipId: string,
    tenantId: string,
    deactivatedBy: string
  ): Promise<void> {
    await this.updateMembership({
      membershipId,
      tenantId,
      status: MembershipStatus.SUSPENDED,
      updatedBy: deactivatedBy,
    });

    logger.info('Staff deactivated', { membershipId, tenantId });
  }

  /**
   * Reactivate a staff member
   */
  async reactivateStaff(
    membershipId: string,
    tenantId: string,
    reactivatedBy: string
  ): Promise<void> {
    await this.updateMembership({
      membershipId,
      tenantId,
      status: MembershipStatus.ACTIVE,
      updatedBy: reactivatedBy,
    });

    logger.info('Staff reactivated', { membershipId, tenantId });
  }

  /**
   * Get pending invitations for a tenant
   */
  async getPendingInvitations(tenantId: string): Promise<Array<{
    id: string;
    email: string;
    roleIds: string[];
    invitedBy: string;
    expiresAt: Date;
    createdAt: Date;
  }>> {
    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        status: InvitationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      roleIds: inv.roleIds,
      invitedBy: inv.invitedByUserId,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(
    invitationId: string,
    tenantId: string,
    revokedBy: string
  ): Promise<void> {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId,
      },
    });

    if (!invitation) {
      throw new Error(`Invitation not found: ${invitationId}`);
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REVOKED,
      },
    });

    // Log audit event
    await this.auditService.log({
      tenantId,
      actorUserId: revokedBy,
      eventType: 'invitation.revoked',
      resourceType: 'invitation',
      resourceId: invitationId,
      metadata: {
        email: invitation.email,
      },
    });

    logger.info('Invitation revoked', { invitationId, tenantId });
  }
}

export default StaffService;
