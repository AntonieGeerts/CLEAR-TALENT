import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { ValidationError, AuthorizationError } from '../types';

const prisma = new PrismaClient();

export class OrganizationalGoalsController {
  /**
   * Get organizational goals hierarchy
   */
  static async getGoals(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const { level, department, parentId } = req.query;

    const where: any = { tenantId };

    if (level) {
      where.level = level;
    }

    if (department) {
      where.department = department;
    }

    if (parentId) {
      where.parentId = parentId;
    } else if (level === 'ORGANIZATIONAL') {
      where.parentId = null; // Top-level organizational goals
    }

    const goals = await prisma.organizationalGoal.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
            weight: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: goals,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get goal hierarchy tree
   */
  static async getGoalTree(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    // Get all organizational-level goals with their full hierarchy
    const orgGoals = await prisma.organizationalGoal.findMany({
      where: {
        tenantId,
        level: 'ORGANIZATIONAL',
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orgGoals,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get single goal with full details
   */
  static async getGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const goal = await prisma.organizationalGoal.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            level: true,
            department: true,
            status: true,
            weight: true,
            targetDate: true,
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
    }

    res.json({
      success: true,
      data: goal,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create organizational goal
   */
  static async createGoal(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Only ADMIN, DEPARTMENT_HEAD, or MANAGER can create org goals
    const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD', 'MANAGER'];
    if (!allowedRoles.includes(req.user!.role)) {
      throw new AuthorizationError('Insufficient permissions to create organizational goals');
    }

    const {
      title,
      description,
      level,
      department,
      parentId,
      weight,
      targetDate,
      metadata = {},
    } = req.body;

    if (!title || !level) {
      throw new ValidationError('Title and level are required');
    }

    // Validate parent exists if parentId provided
    if (parentId) {
      const parent = await prisma.organizationalGoal.findFirst({
        where: {
          id: parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new ValidationError('Parent goal not found');
      }
    }

    const goal = await prisma.organizationalGoal.create({
      data: {
        tenantId,
        title,
        description,
        level,
        department,
        parentId,
        weight,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        createdBy: userId,
        metadata,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: goal,
      message: 'Organizational goal created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update organizational goal
   */
  static async updateGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    // Only ADMIN, DEPARTMENT_HEAD, or goal creator can update
    const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD'];

    const existingGoal = await prisma.organizationalGoal.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
    }

    if (!allowedRoles.includes(req.user!.role) && existingGoal.createdBy !== req.user!.id) {
      throw new AuthorizationError('Insufficient permissions to update this goal');
    }

    const {
      title,
      description,
      department,
      weight,
      targetDate,
      status,
      metadata,
    } = req.body;

    const goal = await prisma.organizationalGoal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(weight !== undefined && { weight }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(status && { status }),
        ...(metadata && { metadata }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: goal,
      message: 'Goal updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete organizational goal
   */
  static async deleteGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    // Only ADMIN can delete org goals
    if (req.user!.role !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can delete organizational goals');
    }

    const goal = await prisma.organizationalGoal.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
    }

    if (goal._count.children > 0) {
      throw new ValidationError('Cannot delete goal with child goals. Delete children first.');
    }

    await prisma.organizationalGoal.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Goal deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get goal alignment report
   */
  static async getAlignmentReport(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    const [
      orgGoals,
      deptGoals,
      teamGoals,
      individualGoals,
      totalGoals,
    ] = await Promise.all([
      prisma.organizationalGoal.count({
        where: { tenantId, level: 'ORGANIZATIONAL' },
      }),
      prisma.organizationalGoal.count({
        where: { tenantId, level: 'DEPARTMENTAL' },
      }),
      prisma.organizationalGoal.count({
        where: { tenantId, level: 'TEAM' },
      }),
      prisma.organizationalGoal.count({
        where: { tenantId, level: 'INDIVIDUAL' },
      }),
      prisma.organizationalGoal.count({
        where: { tenantId },
      }),
    ]);

    // Get goals by status
    const goalsByStatus = await prisma.organizationalGoal.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        goalsByLevel: {
          organizational: orgGoals,
          departmental: deptGoals,
          team: teamGoals,
          individual: individualGoals,
        },
        totalGoals,
        goalsByStatus: goalsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
