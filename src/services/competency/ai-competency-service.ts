import { LLMOrchestrator } from '../ai/orchestrator';
import { CompetencyService } from './competency-service';
import { CompetencySuggestion, BehavioralIndicatorSuggestion, AIServiceError } from '../../types';
import { aiLogger } from '../../utils/logger';
import { SuggestFromJDInput, GenerateIndicatorsInput } from '../../utils/validators';

export class AICompetencyService {
  private static orchestrator = LLMOrchestrator.getInstance();

  /**
   * Suggest competencies from job description (S1.3)
   */
  static async suggestCompetenciesFromJD(
    tenantId: string,
    userId: string,
    input: SuggestFromJDInput
  ): Promise<CompetencySuggestion[]> {
    try {
      aiLogger.info('Suggesting competencies from JD', {
        roleTitle: input.roleTitle,
        department: input.department,
      });

      // Generate competencies using AI
      const response = await this.orchestrator.generateFromTemplate(
        'COMPETENCY',
        'suggest-from-jd',
        {
          roleTitle: input.roleTitle,
          department: input.department,
          jobDescription: input.jobDescription,
        },
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'suggest-from-jd',
        }
      );

      // Parse JSON response
      const suggestions = this.orchestrator.parseJSONResponse<CompetencySuggestion[]>(response);

      aiLogger.info('Competencies suggested successfully', {
        count: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      aiLogger.error('Failed to suggest competencies from JD', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to suggest competencies from job description');
    }
  }

  /**
   * Generate behavioral indicators for a competency level (S1.4)
   */
  static async generateBehavioralIndicators(
    competencyId: string,
    tenantId: string,
    userId: string,
    input: GenerateIndicatorsInput
  ): Promise<BehavioralIndicatorSuggestion[]> {
    try {
      // Get competency details
      const competency = await CompetencyService.getCompetencyById(competencyId, tenantId);

      // Find the specified level
      const level = competency.proficiencyLevels.find((l) => l.id === input.levelId);
      if (!level) {
        throw new Error('Proficiency level not found');
      }

      aiLogger.info('Generating behavioral indicators', {
        competencyId,
        levelId: input.levelId,
        count: input.count,
      });

      // Generate indicators using AI
      const response = await this.orchestrator.generateFromTemplate(
        'COMPETENCY',
        'generate-indicators',
        {
          competencyName: competency.name,
          competencyType: competency.type,
          competencyDescription: competency.description,
          levelName: level.name,
          numericLevel: level.numericLevel,
          levelDescription: level.description,
          count: input.count,
        },
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'generate-indicators',
        }
      );

      // Parse JSON response
      const indicators = this.orchestrator.parseJSONResponse<BehavioralIndicatorSuggestion[]>(response);

      aiLogger.info('Behavioral indicators generated successfully', {
        count: indicators.length,
      });

      return indicators;
    } catch (error) {
      aiLogger.error('Failed to generate behavioral indicators', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate behavioral indicators');
    }
  }

  /**
   * Generate complete role profile from job description
   */
  static async generateRoleProfileFromJD(
    tenantId: string,
    userId: string,
    jobDescription: string,
    roleTitle: string,
    department: string
  ) {
    try {
      aiLogger.info('Generating role profile from JD', {
        roleTitle,
        department,
      });

      // Step 1: Suggest competencies
      const competencies = await this.suggestCompetenciesFromJD(tenantId, userId, {
        jobDescription,
        roleTitle,
        department,
      });

      // Return the suggested structure
      // Actual creation would be done by the user/system after review
      return {
        roleTitle,
        department,
        suggestedCompetencies: competencies,
      };
    } catch (error) {
      aiLogger.error('Failed to generate role profile from JD', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate role profile from job description');
    }
  }

  /**
   * Auto-generate proficiency levels for a competency
   */
  static async generateProficiencyLevels(
    competencyId: string,
    tenantId: string,
    userId: string,
    count: number = 5
  ) {
    try {
      const competency = await CompetencyService.getCompetencyById(competencyId, tenantId);

      const prompt = `Generate ${count} proficiency levels for the following competency:

Competency: ${competency.name}
Type: ${competency.type}
Description: ${competency.description}

For each level, provide:
1. name (e.g., Basic, Intermediate, Advanced, Expert, Master)
2. numericLevel (1 to ${count})
3. description (1-2 sentences describing what this level means)

Return the response as a JSON array of objects with "name", "numericLevel", and "description" fields.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'generate-levels',
        }
      );

      const levels = this.orchestrator.parseJSONResponse<Array<{
        name: string;
        numericLevel: number;
        description: string;
      }>>(response);

      // Add sortOrder
      const levelsWithSort = levels.map((level, index) => ({
        ...level,
        sortOrder: index + 1,
      }));

      aiLogger.info('Proficiency levels generated', {
        competencyId,
        count: levels.length,
      });

      return levelsWithSort;
    } catch (error) {
      aiLogger.error('Failed to generate proficiency levels', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate proficiency levels');
    }
  }
}

export default AICompetencyService;
