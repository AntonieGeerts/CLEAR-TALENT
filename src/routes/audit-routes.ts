/**
 * Audit Routes
 *
 * Audit log access and querying for compliance and security monitoring.
 * Supports filtering by actor, event type, resource, date range, and exporting to CSV.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { tenantContext } from '../middleware/tenant-context';
import { asyncHandler } from '../middleware/error-handler';
import { AuditService } from '../services/access-control';
import { AuthRequest, ValidationError } from '../types';
import { Response } from 'express';

const router = Router();
const auditService = new AuditService();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext());

/**
 * GET /api/v1/audit/logs
 * Query audit logs with filtering and pagination
 *
 * Query params:
 *   - actorUserId: string (optional)
 *   - eventType: string (optional)
 *   - resourceType: string (optional)
 *   - resourceId: string (optional)
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - limit: number (default: 100, max: 1000)
 *   - offset: number (default: 0)
 */
router.get(
  '/logs',
  authorize({ resource: 'audit', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const {
      actorUserId,
      eventType,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    // Parse and validate query parameters
    const parsedLimit = Math.min(
      limit ? parseInt(limit as string, 10) : 100,
      1000
    );
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

    const result = await auditService.query({
      tenantId,
      actorUserId: actorUserId as string | undefined,
      eventType: eventType as string | undefined,
      resourceType: resourceType as string | undefined,
      resourceId: resourceId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    });
  })
);

/**
 * GET /api/v1/audit/resources/:resourceType/:resourceId
 * Get audit trail for a specific resource
 *
 * Query params:
 *   - limit: number (default: 50, max: 500)
 */
router.get(
  '/resources/:resourceType/:resourceId',
  authorize({ resource: 'audit', action: 'read' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { resourceType, resourceId } = req.params;
    const { limit } = req.query;

    const parsedLimit = Math.min(
      limit ? parseInt(limit as string, 10) : 50,
      500
    );

    const logs = await auditService.getResourceAuditTrail(
      tenantId,
      resourceType,
      resourceId,
      parsedLimit
    );

    res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * GET /api/v1/audit/users/:userId/activity
 * Get activity log for a specific user
 *
 * Query params:
 *   - limit: number (default: 100, max: 500)
 */
router.get(
  '/users/:userId/activity',
  authorize({
    resource: 'audit',
    action: 'read',
    getContext: (req) => ({
      targetUserId: req.params.userId,
    }),
  }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { userId } = req.params;
    const { limit } = req.query;

    const parsedLimit = Math.min(
      limit ? parseInt(limit as string, 10) : 100,
      500
    );

    const logs = await auditService.getUserActivity(
      tenantId,
      userId,
      parsedLimit
    );

    res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * GET /api/v1/audit/export
 * Export audit logs to CSV format
 *
 * Query params: Same as /logs endpoint
 * Returns: CSV file
 */
router.get(
  '/export',
  authorize({ resource: 'audit', action: 'export' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const {
      actorUserId,
      eventType,
      resourceType,
      resourceId,
      startDate,
      endDate,
    } = req.query;

    const csv = await auditService.exportToCsv({
      tenantId,
      actorUserId: actorUserId as string | undefined,
      eventType: eventType as string | undefined,
      resourceType: resourceType as string | undefined,
      resourceId: resourceId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: 10000, // Max for export
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${Date.now()}.csv`
    );

    res.send(csv);
  })
);

/**
 * DELETE /api/v1/audit/cleanup
 * Delete old audit logs based on retention policy
 *
 * Body: {
 *   beforeDate: ISO date string
 * }
 */
router.delete(
  '/cleanup',
  authorize({ resource: 'audit', action: 'manage' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId!;
    const { beforeDate } = req.body;

    if (!beforeDate) {
      throw new ValidationError('beforeDate is required');
    }

    const deletedCount = await auditService.deleteOldLogs(
      tenantId,
      new Date(beforeDate)
    );

    res.json({
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} audit log entries`,
    });
  })
);

export default router;
