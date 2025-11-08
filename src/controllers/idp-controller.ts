import { Response } from 'express';
import { PrismaClient, DevelopmentPlanStatus } from '@prisma/client';
import { AuthRequest, ValidationError, AuthorizationError, NotFoundError } from '../types';

const prisma = new PrismaClient();

const privilegedRoles = new Set([
  'SYSTEM_ADMIN',
  'TENANT_OWNER',
  'ADMIN',
  'HR_MANAGER',
  'DEPARTMENT_HEAD',
  'MANAGER',
]);

const canManageTenant = (role?: string | null) => (role ? privilegedRoles.has(role) : false);

const dateOrNull = (label: string, value?: string | null, required = false) => {
  if (!value) {
    if (required) {
      throw new ValidationError(`${label} is required`);
    }
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return parsed;
};

const normalizeActions = (actions: unknown) => {
  return Array.isArray(actions) ? actions : [];
};

const clampProgress = (progress?: number) => {
  if (progress === undefined || progress === null || Number.isNaN(progress)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, progress));
};

const normalizeStatus = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as DevelopmentPlanStatus;
  return Object.values(DevelopmentPlanStatus).includes(normalized)
    ? normalized
    : undefined;
};

const serializePlan = (plan: any) => ({
  ...plan,
  actions: plan.actions ?? [],
});

export class IDPController {
  static async list(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const requesterId = req.user!.id;
    const targetEmployeeId = (req.query.employeeId as string) || undefined;
    const requestedStatus = normalizeStatus(req.query.status as string | undefined);
    const isPrivileged = canManageTenant(req.user?.role);

    const where: any = {
      tenantId,
    };

    if (targetEmployeeId) {
      if (targetEmployeeId !== requesterId && !isPrivileged) {
        throw new AuthorizationError('You are not allowed to view plans for other employees');
      }
      where.userId = targetEmployeeId;
    } else if (!isPrivileged) {
      where.userId = requesterId;
    }

    if (requestedStatus) {
      where.status = requestedStatus;
    }

    const plans = await prisma.developmentPlan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: plans.map(serializePlan),
      count: plans.length,
      timestamp: new Date().toISOString(),
    });
  }

  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const plan = await prisma.developmentPlan.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Development plan');
    }

    const isOwner = plan.userId === req.user!.id;
    if (!isOwner && !canManageTenant(req.user?.role)) {
      throw new AuthorizationError('You are not allowed to view this plan');
    }

    res.json({
      success: true,
      data: serializePlan(plan),
      timestamp: new Date().toISOString(),
    });
  }

  static async create(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const requesterId = req.user!.id;
    const {
      employeeId,
      title,
      description,
      status,
      startDate,
      targetDate,
      actions,
      progress,
    } = req.body;

    if (!title || typeof title !== 'string') {
      throw new ValidationError('Title is required');
    }

    const targetUserId = employeeId || requesterId;
    if (targetUserId !== requesterId && !canManageTenant(req.user?.role)) {
      throw new AuthorizationError('You are not allowed to create plans for other employees');
    }

    const normalizedStatus = status && Object.values(DevelopmentPlanStatus).includes(status)
      ? status
      : DevelopmentPlanStatus.DRAFT;

    const plan = await prisma.developmentPlan.create({
      data: {
        tenantId,
        userId: targetUserId,
        title,
        description: description || null,
        status: normalizedStatus || DevelopmentPlanStatus.DRAFT,
        startDate: dateOrNull('startDate', startDate, true),
        targetDate: dateOrNull('targetDate', targetDate || null),
        actions: normalizeActions(actions),
        progress: clampProgress(progress) ?? 0,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: serializePlan(plan),
      message: 'Development plan created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  static async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const {
      title,
      description,
      status,
      startDate,
      targetDate,
      actions,
      progress,
    } = req.body;

    const plan = await prisma.developmentPlan.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!plan) {
      throw new NotFoundError('Development plan');
    }

    const isOwner = plan.userId === req.user!.id;
    if (!isOwner && !canManageTenant(req.user?.role)) {
      throw new AuthorizationError('You are not allowed to update this plan');
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      data.status = normalizedStatus;
    }
    if (startDate !== undefined) {
      data.startDate = dateOrNull('startDate', startDate, true);
    }
    if (targetDate !== undefined) {
      data.targetDate = dateOrNull('targetDate', targetDate || null);
    }
    if (actions !== undefined) {
      data.actions = normalizeActions(actions);
    }
    const normalizedProgress = clampProgress(progress);
    if (normalizedProgress !== undefined) {
      data.progress = normalizedProgress;
    }

    const updated = await prisma.developmentPlan.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: serializePlan(updated),
      message: 'Development plan updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  static async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const plan = await prisma.developmentPlan.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!plan) {
      throw new NotFoundError('Development plan');
    }

    const isOwner = plan.userId === req.user!.id;
    if (!isOwner && !canManageTenant(req.user?.role)) {
      throw new AuthorizationError('You are not allowed to delete this plan');
    }

    await prisma.developmentPlan.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Development plan deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }
}
