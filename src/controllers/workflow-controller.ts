import { Response } from 'express';
import { AuthRequest } from '../types';
import { AIWorkflowService } from '../services/ai/ai-workflow-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkflowController {
  /**
   * Suggest goals/OKRs for a role
   */
  static async suggestGoals(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { roleProfileId, context } = req.body;

    if (!roleProfileId) {
      return res.status(400).json({
        success: false,
        error: 'roleProfileId is required',
      });
    }

    const goals = await AIWorkflowService.suggestGoals(
      tenantId,
      userId,
      roleProfileId,
      context
    );

    res.json({
      success: true,
      data: goals,
      message: 'Goals suggested successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Detect skill gaps for an employee
   */
  static async detectSkillGaps(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { employeeId, roleProfileId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'employeeId is required',
      });
    }

    const gaps = await AIWorkflowService.detectSkillGaps(
      tenantId,
      userId,
      employeeId,
      roleProfileId
    );

    res.json({
      success: true,
      data: gaps,
      message: 'Skill gaps detected successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate Individual Development Plan (IDP)
   */
  static async generateIDP(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { employeeId, options } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'employeeId is required',
      });
    }

    const idp = await AIWorkflowService.generateIDP(
      tenantId,
      userId,
      employeeId,
      options || {}
    );

    res.json({
      success: true,
      data: idp,
      message: 'IDP generated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Save generated IDP to database
   */
  static async saveIDP(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const { employeeId, title, description, actions, startDate, targetDate } = req.body;

    if (!employeeId || !title) {
      return res.status(400).json({
        success: false,
        error: 'employeeId and title are required',
      });
    }

    const developmentPlan = await prisma.developmentPlan.create({
      data: {
        tenantId,
        userId: employeeId,
        title,
        description: description || '',
        actions: actions || [],
        status: 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: developmentPlan,
      message: 'IDP saved successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Analyze feedback sentiment and themes
   */
  static async analyzeFeedback(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { feedbackTexts } = req.body;

    if (!feedbackTexts || !Array.isArray(feedbackTexts) || feedbackTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'feedbackTexts array is required and must not be empty',
      });
    }

    const analysis = await AIWorkflowService.analyzeFeedback(
      tenantId,
      userId,
      feedbackTexts
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Feedback analyzed successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get feedback for an employee and analyze
   */
  static async analyzeFeedbackForEmployee(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { employeeId } = req.params;

    // Get recent feedback for the employee
    const feedback = await prisma.feedbackItem.findMany({
      where: {
        tenantId,
        receiverId: employeeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 feedback items
      select: {
        text: true,
        type: true,
        createdAt: true,
      },
    });

    if (feedback.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No feedback found for this employee',
          feedbackCount: 0,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const feedbackTexts = feedback.map((f) => f.text);
    const analysis = await AIWorkflowService.analyzeFeedback(
      tenantId,
      userId,
      feedbackTexts
    );

    res.json({
      success: true,
      data: {
        ...analysis,
        feedbackCount: feedback.length,
      },
      message: 'Feedback analyzed successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suggest learning path for a competency
   */
  static async suggestLearningPath(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const { competencyId, currentLevel, targetLevel } = req.body;

    if (!competencyId || currentLevel === undefined || targetLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: 'competencyId, currentLevel, and targetLevel are required',
      });
    }

    const learningPath = await AIWorkflowService.suggestLearningPath(
      tenantId,
      userId,
      competencyId,
      currentLevel,
      targetLevel
    );

    res.json({
      success: true,
      data: learningPath,
      message: 'Learning path suggested successfully',
      timestamp: new Date().toISOString(),
    });
  }
}

export default WorkflowController;
