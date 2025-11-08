/**
 * Staff Routes
 *
 * Staff invitation, membership management, and onboarding for multi-tenant system.
 * Supports inviting new staff, accepting invitations, and managing member roles/status.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { tenantContext } from '../middleware/tenant-context';
import { asyncHandler } from '../middleware/error-handler';
import { StaffService } from '../services/access-control';
import { AuthRequest, ValidationError } from '../types';
import { Response } from 'express';
import { MembershipStatus } from '@prisma/client';

const router = Router();
const staffService = new StaffService();

/**
 * POST /api/v1/staff/accept-invitation
 * Accept a staff invitation and create user/membership
 * PUBLIC ENDPOINT - No authentication required
 *
 * Body: {
 *   invitationToken: string,
 *   email: string,
 *   password: string,
 *   firstName: string,
 *   lastName: string
 * }
 */
router.post(
  '/accept-invitation',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitationToken, email, password, firstName, lastName } = req.body;

    // Validation
    if (!invitationToken || typeof invitationToken !== 'string') {
      throw new ValidationError('Invitation token is required');
    }

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    if (!firstName || typeof firstName !== 'string') {
      throw new ValidationError('First name is required');
    }

    if (!lastName || typeof lastName !== 'string') {
      throw new ValidationError('Last name is required');
    }

    const result = await staffService.acceptInvitation({
      invitationToken,
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Invitation accepted successfully. You can now login.',
    });
  })
);

// All routes below require authentication and tenant context
// Allow system admins to manage staff across all tenants
router.use(authenticate);
router.use(tenantContext({ allowSystemAdmin: true }));

/**
 * GET /api/v1/staff
 * List staff members for tenant with filtering and pagination
 *
 * Query params:
 *   - status: MembershipStatus (optional)
 *   - roleId: string (optional)
 *   - department: string (optional)
 *   - search: string (optional)
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */
router.get(
  '/',
  authorize({ resource: 'staff', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { status, roleId, department, search, limit, offset } = req.query;

    const result = await staffService.listStaff({
      tenantId,
      status: status as MembershipStatus | undefined,
      roleId: roleId as string | undefined,
      department: department as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({
      success: true,
      data: result.members,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
    });
  })
);

/**
 * POST /api/v1/staff/invite
 * Invite a new staff member
 *
 * Body: {
 *   email: string,
 *   roleIds: string[],
 *   expiresInDays?: number,
 *   metadata?: Record<string, any>
 * }
 */
router.post(
  '/invite',
  authorize({ resource: 'staff', action: 'invite' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { email, roleIds, expiresInDays, metadata } = req.body;

    // Validation
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new ValidationError('At least one role must be specified');
    }

    const result = await staffService.inviteStaff({
      tenantId,
      email,
      roleIds,
      invitedBy: userId,
      expiresInDays,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Staff invitation sent successfully',
    });
  })
);

/**
 * GET /api/v1/staff/invitations
 * Get pending invitations for tenant
 */
router.get(
  '/invitations',
  authorize({ resource: 'staff', action: 'invite' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;

    const invitations = await staffService.getPendingInvitations(tenantId);

    res.json({
      success: true,
      data: invitations,
    });
  })
);

/**
 * DELETE /api/v1/staff/invitations/:invitationId
 * Revoke a pending invitation
 */
router.delete(
  '/invitations/:invitationId',
  authorize({ resource: 'staff', action: 'invite' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { invitationId } = req.params;

    await staffService.revokeInvitation(invitationId, tenantId, userId);

    res.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  })
);

/**
 * PUT /api/v1/staff/:membershipId
 * Update staff member's membership (roles, status, metadata)
 *
 * Body: {
 *   primaryRoleId?: string,
 *   additionalRoleIds?: string[],
 *   status?: MembershipStatus,
 *   metadata?: Record<string, any>
 * }
 */
router.put(
  '/:membershipId',
  authorize({
    resource: 'staff',
    action: 'update',
    getContext: (req) => ({
      // Get the membership to check if user can update it
      membershipId: req.params.membershipId,
    }),
  }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { membershipId } = req.params;
    const { primaryRoleId, additionalRoleIds, status, metadata } = req.body;

    const member = await staffService.updateMembership({
      membershipId,
      tenantId,
      primaryRoleId,
      additionalRoleIds,
      status: status as MembershipStatus | undefined,
      metadata,
      updatedBy: userId,
    });

    res.json({
      success: true,
      data: member,
      message: 'Staff member updated successfully',
    });
  })
);

/**
 * POST /api/v1/staff/:membershipId/deactivate
 * Deactivate (suspend) a staff member
 */
router.post(
  '/:membershipId/deactivate',
  authorize({
    resource: 'staff',
    action: 'manage',
  }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { membershipId } = req.params;

    await staffService.deactivateStaff(membershipId, tenantId, userId);

    res.json({
      success: true,
      message: 'Staff member deactivated successfully',
    });
  })
);

/**
 * POST /api/v1/staff/:membershipId/reactivate
 * Reactivate a suspended staff member
 */
router.post(
  '/:membershipId/reactivate',
  authorize({
    resource: 'staff',
    action: 'manage',
  }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const { membershipId } = req.params;

    await staffService.reactivateStaff(membershipId, tenantId, userId);

    res.json({
      success: true,
      message: 'Staff member reactivated successfully',
    });
  })
);

export default router;
