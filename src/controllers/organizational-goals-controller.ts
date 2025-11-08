import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { ValidationError, AuthorizationError, NotFoundError } from '../types';
import { AIOrganizationalGoalService } from '../services/organizational-goals/ai-organizational-goal-service';

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

    // Define the nested include structure for the full goal hierarchy
    const includeCreator = {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    };

    // Get all organizational-level goals with their full hierarchy
    const orgGoals = await prisma.organizationalGoal.findMany({
      where: {
        tenantId,
        level: 'ORGANIZATIONAL',
        parentId: null,
      },
      include: {
        creator: includeCreator,
        children: {
          include: {
            creator: includeCreator,
            children: {
              include: {
                creator: includeCreator,
                children: {
                  include: {
                    creator: includeCreator,
                  },
                },
              },
            },
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

  /**
   * Generate strategic goals with AI (Balanced Scorecard + KPIs)
   */
  static async generateStrategicGoals(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      // Only ADMIN can generate strategic goals
      const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD'];
      if (!allowedRoles.includes(req.user!.role)) {
        throw new AuthorizationError('Insufficient permissions to generate strategic goals');
      }

      const { organizationName, industry, organizationDescription } = req.body;

      if (!organizationName || !industry || !organizationDescription) {
        throw new ValidationError('Organization name, industry, and description are required');
      }

      // Generate goals using AI
      const generatedGoals = await AIOrganizationalGoalService.generateStrategicGoals(
        tenantId,
        userId,
        {
          organizationName,
          industry,
          organizationDescription,
        }
      );

      res.json({
        success: true,
        data: {
          goals: generatedGoals,
          count: generatedGoals.length,
        },
        message: 'Strategic goals generated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating strategic goals:', error);

      // Return detailed error for debugging
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate strategic goals',
        details: error.stack,
        hint: 'Please ensure the AI prompt template is installed. Run: npm run add-goal-template',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Create organizational goals from AI-generated suggestions
   */
  static async createGoalsFromAI(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Only ADMIN can create strategic goals
    const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD'];
    if (!allowedRoles.includes(req.user!.role)) {
      throw new AuthorizationError('Insufficient permissions to create strategic goals');
    }

    const { goals } = req.body;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      throw new ValidationError('Goals array is required');
    }

    // Create goals in database
    const createdGoals = await AIOrganizationalGoalService.createGoalsFromAI(
      tenantId,
      userId,
      goals
    );

    res.status(201).json({
      success: true,
      data: createdGoals,
      message: `${createdGoals.length} strategic goals created successfully`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate KPIs for a specific goal using AI
   * AUTOMATICALLY SAVES the generated KPIs to the goal's metadata
   */
  static async generateKPIsForGoal(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const { goalId, goalTitle, goalDescription, additionalContext } = req.body;

    if (!goalId || !goalTitle) {
      throw new ValidationError('Goal ID and title are required');
    }

    try {
      // Verify goal exists and belongs to tenant
      const existingGoal = await prisma.organizationalGoal.findFirst({
        where: { id: goalId, tenantId },
      });

      if (!existingGoal) {
        throw new NotFoundError('Goal not found');
      }

      // Generate KPIs using AI
      const kpis = await AIOrganizationalGoalService.generateKPIsForGoal(
        tenantId,
        userId,
        {
          goalId,
          goalTitle,
          goalDescription: goalDescription || '',
          additionalContext: additionalContext || '',
        }
      );

      // Get existing metadata or create new
      const existingMetadata = (existingGoal.metadata as any) || {};

      // AUTOMATICALLY SAVE KPIs to the goal's metadata
      const updatedGoal = await prisma.organizationalGoal.update({
        where: { id: goalId },
        data: {
          metadata: {
            ...existingMetadata,
            kpis,
            kpisGeneratedAt: new Date().toISOString(),
            kpisGeneratedBy: userId,
          } as any,
          updatedAt: new Date(),
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
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          kpis,
          goal: updatedGoal,
        },
        message: 'KPIs generated and saved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating KPIs:', error);
      throw error;
    }
  }

  /**
   * Update goal with AI-generated KPIs
   */
  static async updateGoalKPIs(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { id } = req.params;
    const { kpis } = req.body;

    if (!kpis || !Array.isArray(kpis)) {
      throw new ValidationError('KPIs array is required');
    }

    // Verify goal exists and belongs to tenant
    const existingGoal = await prisma.organizationalGoal.findFirst({
      where: { id, tenantId },
    });

    if (!existingGoal) {
      throw new NotFoundError('Goal not found');
    }

    // Get existing metadata or create new
    const existingMetadata = (existingGoal.metadata as any) || {};

    // Update goal with KPIs in metadata
    const updatedGoal = await prisma.organizationalGoal.update({
      where: { id },
      data: {
        metadata: {
          ...existingMetadata,
          kpis,
          kpisGeneratedAt: new Date().toISOString(),
          kpisGeneratedBy: userId,
        } as any,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: updatedGoal,
      message: 'Goal KPIs updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate child goals for a parent goal using AI
   */
  static async generateChildGoals(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      // Only ADMIN, DEPARTMENT_HEAD, or MANAGER can generate goals
      const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD', 'MANAGER'];
      if (!allowedRoles.includes(req.user!.role)) {
        throw new AuthorizationError('Insufficient permissions to generate child goals');
      }

      const {
        parentGoalId,
        targetLevel,
        context,
        numberOfGoals,
      } = req.body;

      if (!parentGoalId || !targetLevel) {
        throw new ValidationError('Parent goal ID and target level are required');
      }

      // Validate target level
      const validLevels = ['DEPARTMENTAL', 'TEAM', 'INDIVIDUAL'];
      if (!validLevels.includes(targetLevel)) {
        throw new ValidationError(
          `Invalid target level. Must be one of: ${validLevels.join(', ')}`
        );
      }

      // Verify parent goal exists
      const parentGoal = await prisma.organizationalGoal.findFirst({
        where: {
          id: parentGoalId,
          tenantId,
        },
      });

      if (!parentGoal) {
        throw new NotFoundError('Parent goal not found');
      }

      // Generate child goals using AI
      const generatedGoals = await AIOrganizationalGoalService.generateChildGoals(
        tenantId,
        userId,
        {
          parentGoalId,
          parentGoalTitle: parentGoal.title,
          parentGoalDescription: parentGoal.description || '',
          targetLevel,
          context,
          numberOfGoals,
        }
      );

      res.json({
        success: true,
        data: {
          parentGoal: {
            id: parentGoal.id,
            title: parentGoal.title,
            level: parentGoal.level,
          },
          childGoals: generatedGoals,
          count: generatedGoals.length,
          targetLevel,
        },
        message: 'Child goals generated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating child goals:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate child goals',
        details: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Create child goals from AI-generated suggestions
   */
  static async createChildGoalsFromAI(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Only ADMIN, DEPARTMENT_HEAD, or MANAGER can create goals
    const allowedRoles = ['ADMIN', 'DEPARTMENT_HEAD', 'MANAGER'];
    if (!allowedRoles.includes(req.user!.role)) {
      throw new AuthorizationError('Insufficient permissions to create child goals');
    }

    const { parentGoalId, targetLevel, goals } = req.body;

    if (!parentGoalId || !targetLevel || !goals || !Array.isArray(goals) || goals.length === 0) {
      throw new ValidationError('Parent goal ID, target level, and goals array are required');
    }

    // Validate target level
    const validLevels = ['DEPARTMENTAL', 'TEAM', 'INDIVIDUAL'];
    if (!validLevels.includes(targetLevel)) {
      throw new ValidationError(
        `Invalid target level. Must be one of: ${validLevels.join(', ')}`
      );
    }

    // Verify parent goal exists
    const parentGoal = await prisma.organizationalGoal.findFirst({
      where: {
        id: parentGoalId,
        tenantId,
      },
    });

    if (!parentGoal) {
      throw new NotFoundError('Parent goal not found');
    }

    // Create child goals in database
    const createdGoals = await AIOrganizationalGoalService.createChildGoalsFromAI(
      tenantId,
      userId,
      parentGoalId,
      targetLevel,
      goals
    );

    res.status(201).json({
      success: true,
      data: {
        parentGoal: {
          id: parentGoal.id,
          title: parentGoal.title,
          level: parentGoal.level,
        },
        childGoals: createdGoals,
        count: createdGoals.length,
        targetLevel,
      },
      message: `${createdGoals.length} child goals created successfully`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get goals grouped by level for tabbed UI
   */
  static async getGoalsByLevel(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const { parentId } = req.query;

    // Build the base query
    const baseWhere: any = { tenantId };
    if (parentId) {
      baseWhere.parentId = parentId;
    }

    // Get goals for each level
    const [organizational, departmental, team, individual] = await Promise.all([
      prisma.organizationalGoal.findMany({
        where: {
          ...baseWhere,
          level: 'ORGANIZATIONAL',
          ...(parentId ? {} : { parentId: null }), // Top-level only if no parentId
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organizationalGoal.findMany({
        where: {
          ...baseWhere,
          level: 'DEPARTMENTAL',
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
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organizationalGoal.findMany({
        where: {
          ...baseWhere,
          level: 'TEAM',
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
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organizationalGoal.findMany({
        where: {
          ...baseWhere,
          level: 'INDIVIDUAL',
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        organizational,
        departmental,
        team,
        individual,
        counts: {
          organizational: organizational.length,
          departmental: departmental.length,
          team: team.length,
          individual: individual.length,
          total:
            organizational.length +
            departmental.length +
            team.length +
            individual.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete all organizational goals for the tenant
   * Only accessible by ADMIN users
   */
  static async deleteAllGoals(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    // Only ADMIN can delete all goals
    if (req.user!.role !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can delete all goals');
    }

    // Count goals before deletion
    const goalsCount = await prisma.organizationalGoal.count({
      where: { tenantId },
    });

    // Delete all goals for this tenant
    const result = await prisma.organizationalGoal.deleteMany({
      where: { tenantId },
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.count,
        previousCount: goalsCount,
      },
      message: `All organizational goals (${result.count}) have been deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  }
}
