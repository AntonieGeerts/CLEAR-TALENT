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
   * Generate custom competency category names based on company context
   */
  static async generateCategories(req: AuthRequest, res: Response) {
    const { companyContext, count = 6 } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    if (!companyContext?.companyName || !companyContext?.industry) {
      return res.status(400).json({
        success: false,
        error: 'companyContext with companyName and industry is required',
      });
    }

    const categories = await AICompetencyService.generateCompetencyCategories(
      tenantId,
      userId,
      companyContext,
      count
    );

    res.json({
      success: true,
      data: categories,
      message: `${categories.length} custom competency categories generated for ${companyContext.companyName}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate competencies by category (supports custom category names)
   */
  static async generateByCategory(req: AuthRequest, res: Response) {
    const {
      categoryName,
      categoryDescription,
      category,
      count = 5,
      companyContext,
      categoriesCount = 3,
    } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    let targetCategories: Array<{ name: string; description?: string; type?: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL' }> = [];

    if (categoryName) {
      targetCategories = [
        {
          name: categoryName,
          description: categoryDescription,
          type: category,
        },
      ];
    } else {
      if (!companyContext?.companyName || !companyContext?.industry) {
        return res.status(400).json({
          success: false,
          error: 'companyContext with companyName and industry is required when categoryName is not provided',
        });
      }

      const generatedCategories = await AICompetencyService.generateCompetencyCategories(
        tenantId,
        userId,
        companyContext,
        categoriesCount
      );

      const filtered = generatedCategories.filter(cat => !category || cat.type === category);
      targetCategories = (filtered.length ? filtered : generatedCategories).slice(0, categoriesCount);
    }

    const competencyGroups = [] as Array<{
      category: { name: string; description?: string; type?: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL' };
      competencies: Array<{ name: string; description: string; category: string; type: string }>;
    }>;

    for (const cat of targetCategories) {
      const catCompetencies = await AICompetencyService.generateCompetenciesByCategory(
        tenantId,
        userId,
        cat.name,
        cat.description || categoryDescription,
        count,
        companyContext,
        cat.type || category
      );
      competencyGroups.push({
        category: cat,
        competencies: catCompetencies.map(comp => ({
          ...comp,
          category: cat.name,
        })),
      });
    }

    const flattened = competencyGroups.flatMap(group => group.competencies);

    res.json({
      success: true,
      data: flattened,
      metadata: {
        categories: competencyGroups.map(group => ({
          name: group.category.name,
          description: group.category.description,
          type: group.category.type,
          count: group.competencies.length,
        })),
      },
      message:
        flattened.length === 0
          ? 'No competencies were generated. Try adjusting your company context or category filters.'
          : `${flattened.length} competencies generated across ${competencyGroups.length} category(ies)`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate assessment questions for a competency
   * Generates questions for each proficiency level (Basic, Proficient, Advanced, Expert)
   *
   * Request body can be:
   * 1. { "questionsPerLevel": 3 } - Generate 3 questions for each level
   * 2. { "questionsPerLevel": { "Basic": 2, "Proficient": 3, "Advanced": 4, "Expert": 5 } } - Specify per level
   */
  static async generateAssessmentQuestions(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { questionsPerLevel = 3, autoSave = true } = req.body;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Validate input
    if (typeof questionsPerLevel === 'object' && questionsPerLevel !== null) {
      // Validate that all values are positive numbers
      for (const [level, count] of Object.entries(questionsPerLevel)) {
        if (typeof count !== 'number' || count < 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid count for level "${level}": must be a non-negative number`,
          });
        }
      }
    } else if (typeof questionsPerLevel !== 'number' || questionsPerLevel < 1) {
      return res.status(400).json({
        success: false,
        error: 'questionsPerLevel must be a positive number or an object mapping level names to counts',
      });
    }

    const { assessment, flattenedQuestions } = await AICompetencyService.generateAssessmentQuestions(
      id,
      tenantId,
      userId,
      questionsPerLevel
    );

    let savedQuestions = flattenedQuestions;
    if (autoSave) {
      const { CompetencyQuestionService } = await import(
        '../services/competency/question-service'
      );

      const mappedQuestions = flattenedQuestions.map((q: any) => ({
        statement: q.statement,
        type: AIController.mapQuestionType(q.type),
        examples: q.examples || [],
        proficiencyLevelId: q.proficiencyLevelId,
        ratingOptions: q.ratingOptions,
      }));

      savedQuestions = await CompetencyQuestionService.bulkCreateQuestions(id, mappedQuestions);
    }

    res.json({
      success: true,
      data: assessment,
      savedQuestions,
      message: `${savedQuestions.length} behavioral indicators generated across ${assessment.levels.length} proficiency levels`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Map AI-generated question types to QuestionType enum
   */
  private static mapQuestionType(aiType: string): 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE' {
    switch (aiType.toLowerCase()) {
      case 'behavioral':
        return 'BEHAVIORAL';
      case 'outcome':
        return 'SITUATIONAL';
      case 'frequency':
        return 'BEHAVIORAL';
      default:
        return 'BEHAVIORAL';
    }
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
