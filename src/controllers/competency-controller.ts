import { Response } from 'express';
import { AuthRequest } from '../types';
import { CompetencyService } from '../services/competency/competency-service';
import { CompetencyQuestionService } from '../services/competency/competency-question-service';
import {
  CreateCompetencyInput,
  UpdateCompetencyInput,
  CompetencyQuery,
} from '../utils/validators';

export class CompetencyController {
  /**
   * Create competency
   */
  static async create(req: AuthRequest, res: Response) {
    const data = req.body as CreateCompetencyInput;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const competency = await CompetencyService.createCompetency(tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: competency,
      message: 'Competency created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * List competencies
   */
  static async list(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const query = req.query as unknown as CompetencyQuery;

    const result = await CompetencyService.listCompetencies(tenantId, query);

    res.json({
      success: true,
      data: result.competencies,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get competency by ID
   */
  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const competency = await CompetencyService.getCompetencyById(id, tenantId);

    res.json({
      success: true,
      data: competency,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update competency
   */
  static async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateCompetencyInput;
    const tenantId = req.tenant!.id;

    const competency = await CompetencyService.updateCompetency(id, tenantId, data);

    res.json({
      success: true,
      data: competency,
      message: 'Competency updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete competency
   */
  static async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    await CompetencyService.deleteCompetency(id, tenantId);

    res.json({
      success: true,
      message: 'Competency deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * List assessment questions for a competency
   */
  static async listQuestions(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const query = req.query as any;

    const result = await CompetencyQuestionService.listQuestions(id, tenantId, query);

    res.json({
      success: true,
      data: result.questions,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get a specific assessment question
   */
  static async getQuestion(req: AuthRequest, res: Response) {
    const { id, questionId } = req.params;
    const tenantId = req.tenant!.id;

    const question = await CompetencyQuestionService.getQuestionById(questionId, id, tenantId);

    res.json({
      success: true,
      data: question,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create an assessment question
   */
  static async createQuestion(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const data = req.body;

    const question = await CompetencyQuestionService.createQuestion(id, tenantId, userId, data);

    res.status(201).json({
      success: true,
      data: question,
      message: 'Assessment question created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update an assessment question
   */
  static async updateQuestion(req: AuthRequest, res: Response) {
    const { id, questionId } = req.params;
    const tenantId = req.tenant!.id;
    const data = req.body;

    const question = await CompetencyQuestionService.updateQuestion(
      questionId,
      id,
      tenantId,
      data
    );

    res.json({
      success: true,
      data: question,
      message: 'Assessment question updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete an assessment question
   */
  static async deleteQuestion(req: AuthRequest, res: Response) {
    const { id, questionId } = req.params;
    const tenantId = req.tenant!.id;

    await CompetencyQuestionService.deleteQuestion(questionId, id, tenantId);

    res.json({
      success: true,
      message: 'Assessment question deleted successfully',
      timestamp: new Date().toISOString(),
    });
  }
}

export default CompetencyController;
