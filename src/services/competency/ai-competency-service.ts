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
   * Generate competencies by category (Core, Leadership, Functional)
   */
  static async generateCompetenciesByCategory(
    tenantId: string,
    userId: string,
    category: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL',
    count: number = 5,
    companyContext?: {
      companyName: string;
      industry: string;
      companySize?: string;
      companyValues?: string;
      companyDescription?: string;
    }
  ) {
    try {
      aiLogger.info('Generating competencies by category', {
        category,
        count,
        companyContext,
      });

      const categoryDescriptions = {
        CORE: 'Core competencies are fundamental skills and behaviors essential for all employees across the organization.',
        LEADERSHIP: 'Leadership competencies are skills required for managing and leading teams effectively.',
        FUNCTIONAL: 'Functional competencies are role-specific technical skills and knowledge required for particular job functions.',
      };

      const response = await this.orchestrator.generateFromTemplate(
        'COMPETENCY',
        'generate-by-category',
        {
          category,
          categoryDescription: categoryDescriptions[category],
          count,
          companyName: companyContext?.companyName || 'Your Organization',
          industry: companyContext?.industry || 'General Business',
          companySize: companyContext?.companySize || undefined,
          companyValues: companyContext?.companyValues || undefined,
          companyDescription: companyContext?.companyDescription || undefined,
        },
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'generate-by-category',
        }
      );

      const competencies = this.orchestrator.parseJSONResponse<Array<{
        name: string;
        description: string;
        category: string;
      }>>(response);

      aiLogger.info('Competencies generated by category', {
        category,
        count: competencies.length,
      });

      return competencies.map(c => ({
        ...c,
        type: category,
      }));
    } catch (error) {
      aiLogger.error('Failed to generate competencies by category', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate competencies by category');
    }
  }

  /**
   * Generate assessment questions/statements for a competency
   * Generates questions for each proficiency level (Basic, Proficient, Advanced, Expert)
   * @param questionsPerLevel - Can be a number (same for all levels) or an object mapping level names to counts
   */
  static async generateAssessmentQuestions(
    competencyId: string,
    tenantId: string,
    userId: string,
    questionsPerLevel: number | Record<string, number> = 3
  ) {
    try {
      const competency = await CompetencyService.getCompetencyById(competencyId, tenantId);

      // Get proficiency levels for this competency
      if (!competency.proficiencyLevels || competency.proficiencyLevels.length === 0) {
        throw new Error('Competency must have proficiency levels before generating assessment questions');
      }

      // Normalize questionsPerLevel to an object format
      const questionCounts = typeof questionsPerLevel === 'number'
        ? {} // Will use default for all levels
        : questionsPerLevel;

      aiLogger.info('Generating assessment questions', {
        competencyId,
        competencyName: competency.name,
        questionsPerLevel,
        proficiencyLevels: competency.proficiencyLevels.length,
      });

      // Define the standard rating options
      const ratingOptions = {
        "1": "Never Demonstrated",
        "2": "Sometimes Demonstrated",
        "3": "Consistently Demonstrated",
        "4": "Consistently demonstrated + shows evidence of higher level application"
      };

      // Target the 4 main proficiency levels
      const targetLevels = ['Basic', 'Proficient', 'Advanced', 'Expert'];
      const levelsToGenerate = competency.proficiencyLevels
        .filter(level => targetLevels.some(target => level.name.toLowerCase().includes(target.toLowerCase())))
        .sort((a, b) => a.numericLevel - b.numericLevel);

      if (levelsToGenerate.length === 0) {
        throw new Error('Competency must have Basic, Proficient, Advanced, and Expert proficiency levels');
      }

      const allQuestions: Array<{
        statement: string;
        type: 'behavioral' | 'outcome' | 'frequency';
        examples: string[];
        proficiencyLevelId: string;
        proficiencyLevelName: string;
        ratingOptions: typeof ratingOptions;
      }> = [];

      // Generate questions for each proficiency level
      for (const level of levelsToGenerate) {
        // Determine how many questions to generate for this level
        const countForLevel = typeof questionsPerLevel === 'number'
          ? questionsPerLevel
          : (questionCounts[level.name] || questionCounts[level.name.toLowerCase()] || 3);

        if (countForLevel === 0) {
          continue; // Skip levels with 0 questions requested
        }

        const prompt = `Generate ${countForLevel} assessment questions/behavioral indicators for evaluating the "${level.name}" proficiency level of the following competency:

Competency: ${competency.name}
Type: ${competency.type}
Category: ${competency.category}
Description: ${competency.description}

Proficiency Level: ${level.name} (Level ${level.numericLevel})
Level Description: ${level.description}

Generate clear, behaviorally-anchored statements that assess behaviors at the ${level.name} level. Each statement should:
1. Be specific and observable behaviors appropriate for the ${level.name} level
2. Focus on actions and outcomes, not personality traits
3. Use action verbs (e.g., "Delivers", "Demonstrates", "Applies", "Creates")
4. Be relevant to workplace situations
5. Clearly distinguish ${level.name} level performance from other levels

Each statement will be rated using this scale:
- Option 1: Never Demonstrated
- Option 2: Sometimes Demonstrated
- Option 3: Consistently Demonstrated
- Option 4: Consistently demonstrated + shows evidence of higher level application

Return the response as a JSON array with this structure:
[
  {
    "statement": "The behavioral indicator statement (e.g., 'Tailors and delivers high-level presentations to diverse audiences using variety of communication tools')",
    "type": "BEHAVIORAL",
    "examples": ["Example of this behavior in practice"]
  }
]`;

        const response = await this.orchestrator.generateCompletion(
          prompt,
          {
            tenantId,
            userId,
            module: 'competency',
            action: `generate-assessment-questions-${level.name.toLowerCase()}`,
          },
          {
            temperature: 0.7,
            maxTokens: 1500,
          }
        );

        const levelQuestions = this.orchestrator.parseJSONResponse<Array<{
          statement: string;
          type: 'behavioral' | 'outcome' | 'frequency';
          examples: string[];
        }>>(response);

        // Add proficiency level info and rating options to each question
        const questionsWithLevel = levelQuestions.map(q => ({
          ...q,
          proficiencyLevelId: level.id,
          proficiencyLevelName: level.name,
          ratingOptions,
        }));

        allQuestions.push(...questionsWithLevel);
      }

      aiLogger.info('Assessment questions generated for all levels', {
        competencyId,
        totalQuestions: allQuestions.length,
        levelsProcessed: levelsToGenerate.length,
      });

      return allQuestions;
    } catch (error) {
      aiLogger.error('Failed to generate assessment questions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate assessment questions');
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
