import { Response } from 'express';
import { AuthRequest } from '../types';
import { AssessmentService } from '../services/competency/assessment-service';
import { apiLogger } from '../utils/logger';

export class AssessmentController {
  /**
   * Create a new assessment session
   * POST /api/v1/assessments
   */
  static async create(req: AuthRequest, res: Response) {
    const { competencyIds } = req.body;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    if (!competencyIds || !Array.isArray(competencyIds) || competencyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'competencyIds must be a non-empty array',
      });
    }

    try {
      const assessment = await AssessmentService.createAssessment({
        tenantId,
        userId,
        competencyIds,
      });

      apiLogger.info('Assessment created', {
        assessmentId: assessment.id,
        userId,
        competencyIds,
      });

      res.status(201).json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      apiLogger.error('Failed to create assessment', { error: error.message, userId });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create assessment',
      });
    }
  }

  /**
   * Get assessment by ID
   * GET /api/v1/assessments/:id
   */
  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    try {
      const assessment = await AssessmentService.getAssessment(id, tenantId);

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      apiLogger.error('Failed to get assessment', { error: error.message, assessmentId: id });
      res.status(404).json({
        success: false,
        error: error.message || 'Assessment not found',
      });
    }
  }

  /**
   * Submit response to a question
   * POST /api/v1/assessments/:id/responses
   */
  static async submitResponse(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { questionId, rating, comment } = req.body;
    const tenantId = req.user!.tenantId;

    if (!questionId || typeof rating !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'questionId and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'rating must be between 1 and 5',
      });
    }

    try {
      const response = await AssessmentService.submitResponse(id, tenantId, {
        questionId,
        rating,
        comment,
      });

      apiLogger.info('Assessment response submitted', {
        assessmentId: id,
        questionId,
        rating,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      apiLogger.error('Failed to submit response', { error: error.message, assessmentId: id });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to submit response',
      });
    }
  }

  /**
   * Complete assessment
   * POST /api/v1/assessments/:id/complete
   */
  static async complete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    try {
      const results = await AssessmentService.completeAssessment(id, tenantId);

      apiLogger.info('Assessment completed', {
        assessmentId: id,
        averageScore: results.averageScore,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      apiLogger.error('Failed to complete assessment', { error: error.message, assessmentId: id });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to complete assessment',
      });
    }
  }

  /**
   * Get user's assessment history
   * GET /api/v1/assessments/my-assessments
   */
  static async getMyAssessments(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    try {
      const assessments = await AssessmentService.getUserAssessments(userId, tenantId);

      res.json({
        success: true,
        data: assessments,
      });
    } catch (error: any) {
      apiLogger.error('Failed to get user assessments', { error: error.message, userId });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get assessments',
      });
    }
  }

  /**
   * Get assessment results
   * GET /api/v1/assessments/:id/results
   */
  static async getResults(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    try {
      const results = await AssessmentService.getAssessmentResults(id, tenantId);

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      apiLogger.error('Failed to get assessment results', {
        error: error.message,
        assessmentId: id,
      });
      res.status(404).json({
        success: false,
        error: error.message || 'Assessment results not found',
      });
    }
  }
}
