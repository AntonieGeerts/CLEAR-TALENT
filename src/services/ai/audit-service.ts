import { PrismaClient, AIAuditStatus } from '@prisma/client';
import { aiLogger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogData {
  tenantId: string;
  userId: string;
  module: string;
  action: string;
  prompt: string;
  response?: string;
  tokensUsed?: number;
  latencyMs?: number;
  status: AIAuditStatus;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Log an AI operation
   */
  static async logOperation(data: AuditLogData): Promise<void> {
    try {
      await prisma.aIAuditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          module: data.module,
          action: data.action,
          prompt: data.prompt,
          response: data.response,
          tokensUsed: data.tokensUsed,
          latencyMs: data.latencyMs,
          status: data.status,
          metadata: data.metadata || {},
        },
      });

      aiLogger.debug('AI operation logged', {
        module: data.module,
        action: data.action,
        status: data.status,
      });
    } catch (error) {
      aiLogger.error('Failed to log AI operation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - audit logging failure shouldn't break the main flow
    }
  }

  /**
   * Get audit logs for a tenant
   */
  static async getAuditLogs(
    tenantId: string,
    options: {
      userId?: string;
      module?: string;
      status?: AIAuditStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { tenantId };

    if (options.userId) where.userId = options.userId;
    if (options.module) where.module = options.module;
    if (options.status) where.status = options.status;

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.aIAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 100,
        skip: options.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.aIAuditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get usage statistics for a tenant
   */
  static async getUsageStats(tenantId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.aIAuditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        module: true,
        action: true,
        tokensUsed: true,
        latencyMs: true,
        status: true,
      },
    });

    // Calculate statistics
    const stats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter((l) => l.status === 'SUCCESS').length,
      failedRequests: logs.filter((l) => l.status === 'ERROR').length,
      filteredRequests: logs.filter((l) => l.status === 'FILTERED').length,
      totalTokens: logs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0),
      avgLatencyMs: logs.length
        ? logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length
        : 0,
      byModule: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    };

    // Group by module
    logs.forEach((log) => {
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clean old audit logs (retention policy)
   */
  static async cleanOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await prisma.aIAuditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      aiLogger.info('Old audit logs cleaned', {
        deletedCount: result.count,
        retentionDays,
      });

      return result.count;
    } catch (error) {
      aiLogger.error('Failed to clean old audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default AuditService;
