import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { ValidationError, NotFoundError } from '../types';

const prisma = new PrismaClient();

export class GoalsController {
  /**
   * Get all goals for the authenticated user
   */
  static async getGoals(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { status, roleProfileId } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (roleProfileId) {
      where.roleProfileId = roleProfileId;
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        roleProfile: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: goals,
      count: goals.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get a single goal by ID
   */
  static async getGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        roleProfile: {
          select: {
            id: true,
            title: true,
            department: true,
            seniority: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    res.json({
      success: true,
      data: goal,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create a new goal
   */
  static async createGoal(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { title, description, targetDate, roleProfileId, metadata = {} } = req.body;

    if (!title || !description) {
      throw new ValidationError('Title and description are required');
    }

    // Verify role profile exists if provided
    if (roleProfileId) {
      const roleProfile = await prisma.roleProfile.findFirst({
        where: {
          id: roleProfileId,
          tenantId: req.tenant!.id,
        },
      });

      if (!roleProfile) {
        throw new ValidationError('Role profile not found');
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        roleProfileId,
        metadata,
        status: 'DRAFT',
        progress: 0,
      },
      include: {
        roleProfile: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: goal,
      message: 'Goal created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update a goal
   */
  static async updateGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, description, targetDate, status, progress, metadata } = req.body;

    // Verify goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      throw new NotFoundError('Goal not found');
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(metadata && { metadata }),
      },
      include: {
        roleProfile: {
          select: {
            id: true,
            title: true,
            department: true,
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
   * Delete a goal
   */
  static async deleteGoal(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      throw new NotFoundError('Goal not found');
    }

    await prisma.goal.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Goal deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get goal statistics for the user
   */
  static async getGoalStats(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const [total, draft, active, completed, cancelled, archived] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: 'DRAFT' } }),
      prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.goal.count({ where: { userId, status: 'CANCELLED' } }),
      prisma.goal.count({ where: { userId, status: 'ARCHIVED' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          draft,
          active,
          completed,
          cancelled,
          archived,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
}
