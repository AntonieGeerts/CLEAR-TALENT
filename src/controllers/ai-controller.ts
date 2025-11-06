import { Response } from 'express';
import { AuthRequest } from '../types';
import { AICompetencyService } from '../services/competency/ai-competency-service';
import { AITextService } from '../services/ai/ai-text-service';
import {
  SuggestFromJDInput,
  GenerateIndicatorsInput,
  ImproveTextInput,
  SummarizeTextInput,
} from '../utils/validators';
import { CompetencyService } from '../services/competency/competency-service';

export class AIController {
  /**
   * Suggest competencies from job description
   */
  static async suggestFromJD(req: AuthRequest, res: Response) {
    const data = req.body as SuggestFromJDInput;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const suggestions = await AICompetencyService.suggestCompetenciesFromJD(
      tenantId,
      userId,
      data
    );

    res.json({
      success: true,
      data: suggestions,
      message: 'Competencies suggested successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate behavioral indicators
   */
  static async generateIndicators(req: AuthRequest, res: Response) {
    const { id } = req.params; // competency ID
    const data = req.body as GenerateIndicatorsInput;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const indicators = await AICompetencyService.generateBehavioralIndicators(
      id,
      tenantId,
      userId,
      data
    );

    res.json({
      success: true,
      data: indicators,
      message: 'Behavioral indicators generated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate proficiency levels
   */
  static async generateLevels(req: AuthRequest, res: Response) {
    const { id } = req.params; // competency ID
    const { count = 5 } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const levels = await AICompetencyService.generateProficiencyLevels(
      id,
      tenantId,
      userId,
      count
    );

    res.json({
      success: true,
      data: levels,
      message: 'Proficiency levels generated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate competencies by category
   */
  static async generateByCategory(req: AuthRequest, res: Response) {
    const { category, count = 5 } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    if (!['CORE', 'LEADERSHIP', 'FUNCTIONAL'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be CORE, LEADERSHIP, or FUNCTIONAL',
      });
    }

    const competencies = await AICompetencyService.generateCompetenciesByCategory(
      tenantId,
      userId,
      category,
      count
    );

    res.json({
      success: true,
      data: competencies,
      message: `${competencies.length} ${category} competencies generated`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate assessment questions for a competency
   */
  static async generateAssessmentQuestions(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { count = 5 } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const questions = await AICompetencyService.generateAssessmentQuestions(
      id,
      tenantId,
      userId,
      count
    );

    res.json({
      success: true,
      data: questions,
      message: `${questions.length} assessment questions generated`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create proficiency levels from AI suggestions
   */
  static async createLevelsFromAI(req: AuthRequest, res: Response) {
    const { id } = req.params; // competency ID
    const { count = 5, autoCreate = false } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Generate levels
    const levels = await AICompetencyService.generateProficiencyLevels(
      id,
      tenantId,
      userId,
      count
    );

    // If autoCreate is true, create them in the database
    if (autoCreate) {
      const created = await CompetencyService.createProficiencyLevels(id, tenantId, levels);
      return res.json({
        success: true,
        data: created,
        message: 'Proficiency levels generated and created successfully',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: levels,
      message: 'Proficiency levels generated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Improve text
   */
  static async improveText(req: AuthRequest, res: Response) {
    const data = req.body as ImproveTextInput;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const improvedText = await AITextService.improveText(tenantId, userId, data);

    res.json({
      success: true,
      data: {
        originalText: data.text,
        improvedText,
      },
      message: 'Text improved successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Summarize text
   */
  static async summarizeText(req: AuthRequest, res: Response) {
    const data = req.body as SummarizeTextInput;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const summary = await AITextService.summarizeText(tenantId, userId, data);

    res.json({
      success: true,
      data: {
        originalText: data.text,
        summary,
      },
      message: 'Text summarized successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Rewrite text
   */
  static async rewriteText(req: AuthRequest, res: Response) {
    const { text, tone = 'constructive' } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const rewrittenText = await AITextService.rewriteText(tenantId, userId, text, tone);

    res.json({
      success: true,
      data: {
        originalText: text,
        rewrittenText,
        tone,
      },
      message: 'Text rewritten successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Structure feedback
   */
  static async structureFeedback(req: AuthRequest, res: Response) {
    const { text } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const structuredText = await AITextService.structureFeedback(tenantId, userId, text);

    res.json({
      success: true,
      data: {
        originalText: text,
        structuredText,
      },
      message: 'Feedback structured successfully',
      timestamp: new Date().toISOString(),
    });
  }
}

export default AIController;
