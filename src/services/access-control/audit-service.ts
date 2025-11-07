/**
 * Audit Service
 *
 * Comprehensive audit logging for access control events and system actions.
 *
 * Features:
 * - Structured event logging for compliance
 * - Resource-based audit trails
 * - User action tracking
 * - Metadata capture (diffs, old vs new values)
 * - Query and export capabilities
 *
 * Usage:
 *   const auditService = new AuditService();
 *   await auditService.log({
 *     tenantId: 'tenant-123',
 *     actorUserId: 'user-456',
 *     eventType: 'staff.invited',
 *     resourceType: 'invitation',
 *     resourceId: 'inv-789',
 *     metadata: { email: 'newuser@example.com', roles: ['EMPLOYEE'] }
 *   });
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

const prisma = new PrismaClient();

export interface AuditLogInput {
  tenantId: string;
  actorUserId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  tenantId: string;
  actorUserId?: string;
  eventType?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorUserId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Standard event types for access control system
 */
export const AuditEventTypes = {
  // Staff Management
  STAFF_INVITED: 'staff.invited',
  STAFF_ACTIVATED: 'staff.activated',
  STAFF_DEACTIVATED: 'staff.deactivated',
  STAFF_SUSPENDED: 'staff.suspended',
  STAFF_UPDATED: 'staff.updated',
  STAFF_LEFT: 'staff.left',

  // Role Management
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
  ROLE_ASSIGNED: 'role.assigned',
  ROLE_UNASSIGNED: 'role.unassigned',
  ROLE_PERMISSIONS_UPDATED: 'role.permissions_updated',

  // Permission Management
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',

  // Approval Flows
  APPROVAL_FLOW_CREATED: 'approval_flow.created',
  APPROVAL_FLOW_UPDATED: 'approval_flow.updated',
  APPROVAL_FLOW_ACTIVATED: 'approval_flow.activated',
  APPROVAL_FLOW_DEACTIVATED: 'approval_flow.deactivated',
  APPROVAL_FLOW_VERSION_PUBLISHED: 'approval_flow.version_published',

  // Approval Instances
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
  APPROVAL_CANCELLED: 'approval.cancelled',

  // Tenant Management
  TENANT_SETTINGS_UPDATED: 'tenant.settings_updated',
  TENANT_PLAN_CHANGED: 'tenant.plan_changed',

  // Access Control
  ACCESS_GRANTED: 'access.granted',
  ACCESS_DENIED: 'access.denied',
  PERMISSION_CHECK_FAILED: 'permission.check_failed',
} as const;

export class AuditService {
  /**
   * Log an audit event
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
          eventType: input.eventType,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          metadata: input.metadata || {},
        },
      });

      logger.debug('Audit log created', {
        eventType: input.eventType,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, input });
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log a staff-related event
   */
  async logStaffEvent(
    eventType: string,
    tenantId: string,
    actorUserId: string,
    targetUserId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorUserId,
      eventType,
      resourceType: 'user',
      resourceId: targetUserId,
      metadata,
    });
  }

  /**
   * Log a role-related event
   */
  async logRoleEvent(
    eventType: string,
    tenantId: string,
    actorUserId: string,
    roleId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorUserId,
      eventType,
      resourceType: 'role',
      resourceId: roleId,
      metadata,
    });
  }

  /**
   * Log an approval flow event
   */
  async logApprovalFlowEvent(
    eventType: string,
    tenantId: string,
    actorUserId: string,
    flowId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorUserId,
      eventType,
      resourceType: 'approval_flow',
      resourceId: flowId,
      metadata,
    });
  }

  /**
   * Log an approval instance event
   */
  async logApprovalEvent(
    eventType: string,
    tenantId: string,
    actorUserId: string,
    instanceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorUserId,
      eventType,
      resourceType: 'approval_instance',
      resourceId: instanceId,
      metadata,
    });
  }

  /**
   * Query audit logs
   */
  async query(query: AuditLogQuery): Promise<{
    logs: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    const where: any = {
      tenantId: query.tenantId,
    };

    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    if (query.eventType) {
      where.eventType = query.eventType;
    }

    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        tenantId: log.tenantId,
        actorUserId: log.actorUserId,
        eventType: log.eventType,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        metadata: log.metadata as Record<string, any>,
        createdAt: log.createdAt,
      })),
      total,
      hasMore: offset + logs.length < total,
    };
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(
    tenantId: string,
    resourceType: string,
    resourceId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        resourceType,
        resourceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      eventType: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      metadata: log.metadata as Record<string, any>,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    tenantId: string,
    userId: string,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        actorUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      tenantId: log.tenantId,
      actorUserId: log.actorUserId,
      eventType: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      metadata: log.metadata as Record<string, any>,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Export audit logs as CSV
   */
  async exportToCsv(query: AuditLogQuery): Promise<string> {
    const result = await this.query({ ...query, limit: 10000 }); // Max 10k for export

    const headers = ['Timestamp', 'Actor', 'Event Type', 'Resource Type', 'Resource ID', 'Metadata'];
    const rows = result.logs.map(log => [
      log.createdAt.toISOString(),
      log.actorUserId,
      log.eventType,
      log.resourceType,
      log.resourceId,
      JSON.stringify(log.metadata),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Delete old audit logs (for compliance/retention policies)
   */
  async deleteOldLogs(tenantId: string, beforeDate: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: beforeDate,
        },
      },
    });

    logger.info('Deleted old audit logs', {
      tenantId,
      beforeDate,
      count: result.count,
    });

    return result.count;
  }
}

export default AuditService;
