import { Response } from 'express';
import { AuthRequest } from '../types';
import { CompetencyQuestionService } from '../services/competency/question-service';
import { apiLogger } from '../utils/logger';

export class CompetencyQuestionController {
  /**
   * Get all questions for a competency
   */
  static async getByCompetency(req: AuthRequest, res: Response) {
    const { competencyId } = req.params;

    const questions = await CompetencyQuestionService.getQuestionsByCompetency(competencyId);

    res.json({
      success: true,
      data: questions,
    });
  }

  /**
   * Create a new question
   */
  static async create(req: AuthRequest, res: Response) {
    const { competencyId } = req.params;
    const {
      statement,
      type,
      examples,
      proficiencyLevelId,
      ratingOptions,
      weight,
      scoreMin,
      scoreMax,
      scoringSystemId,
    } = req.body;

    const question = await CompetencyQuestionService.createQuestion(competencyId, {
      statement,
      type,
      examples,
      aiGenerated: false,
      proficiencyLevelId,
      ratingOptions,
      weight,
      scoreMin,
      scoreMax,
      scoringSystemId,
    });

    apiLogger.info('Question created', {
      questionId: question.id,
      competencyId,
      type,
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  }

  /**
   * Update a question
   */
  static async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const {
      statement,
      type,
      examples,
      proficiencyLevelId,
      ratingOptions,
      weight,
      scoreMin,
      scoreMax,
      scoringSystemId,
    } = req.body;

    const question = await CompetencyQuestionService.updateQuestion(id, {
      statement,
      type,
      examples,
      proficiencyLevelId,
      ratingOptions,
      weight,
      scoreMin,
      scoreMax,
      scoringSystemId,
    });

    apiLogger.info('Question updated', {
      questionId: id,
    });

    res.json({
      success: true,
      data: question,
    });
  }

  /**
   * Delete a question
   */
  static async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;

    await CompetencyQuestionService.deleteQuestion(id);

    apiLogger.info('Question deleted', {
      questionId: id,
    });

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  }
}
