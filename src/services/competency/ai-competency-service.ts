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
   * Generate custom competency category names based on company context
   */
  static async generateCompetencyCategories(
    tenantId: string,
    userId: string,
    companyContext: {
      companyName: string;
      industry: string;
      companySize?: string;
      companyValues?: string;
      companyDescription?: string;
    },
    count: number = 6
  ) {
    try {
      aiLogger.info('Generating custom competency categories', {
        count,
        companyContext,
      });

      const prompt = `Generate ${count} unique, relevant competency category names for the following company:

Company Name: ${companyContext.companyName}
Industry: ${companyContext.industry}
${companyContext.companySize ? `Company Size: ${companyContext.companySize}` : ''}
${companyContext.companyValues ? `Company Values: ${companyContext.companyValues}` : ''}
${companyContext.companyDescription ? `Description: ${companyContext.companyDescription}` : ''}

Create category names that are:
1. Specific to the ${companyContext.industry} industry
2. Aligned with ${companyContext.companyName}'s unique business context
3. Meaningful for organizing competencies in performance reviews
4. Professional and clear (2-4 words each)
5. Not generic categories like "Core" or "Leadership" - be industry-specific

Examples for different industries:
- Tech Company: "Cloud Architecture", "DevOps Practices", "Product Innovation", "Data Engineering"
- Healthcare: "Patient Care Excellence", "Clinical Protocols", "Healthcare Compliance", "Medical Technology"
- Finance: "Risk Management", "Financial Analysis", "Regulatory Compliance", "Client Advisory"
- Retail: "Customer Experience", "Merchandising Strategy", "Inventory Management", "Sales Excellence"

Return the response as a JSON array with this structure:
[
  {
    "name": "Category Name",
    "description": "Brief description of what competencies fall under this category",
    "type": "CORE" | "LEADERSHIP" | "FUNCTIONAL"
  }
]`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'generate-categories',
        },
        {
          temperature: 0.8,
          maxTokens: 1500,
        }
      );

      const categories = this.orchestrator.parseJSONResponse<Array<{
        name: string;
        description: string;
        type: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL';
      }>>(response);

      aiLogger.info('Competency categories generated', {
        count: categories.length,
      });

      return categories;
    } catch (error) {
      aiLogger.error('Failed to generate competency categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate competency categories');
    }
  }

  /**
   * Generate competencies by category (supports both predefined and custom categories)
   */
  static async generateCompetenciesByCategory(
    tenantId: string,
    userId: string,
    categoryName: string,
    categoryDescription?: string,
    count: number = 5,
    companyContext?: {
      companyName: string;
      industry: string;
      companySize?: string;
      companyValues?: string;
      companyDescription?: string;
    },
    categoryTypeOverride?: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL'
  ) {
    try {
      aiLogger.info('Generating competencies by category', {
        categoryName,
        count,
        companyContext,
      });

      // Determine competency type based on category name or default to FUNCTIONAL
      const categoryType = categoryTypeOverride ?? this.inferCompetencyType(categoryName);

      const prompt = `Generate ${count} specific competencies for the "${categoryName}" category for the following company:

Company Name: ${companyContext?.companyName || 'Your Organization'}
Industry: ${companyContext?.industry || 'General Business'}
${companyContext?.companySize ? `Company Size: ${companyContext.companySize}` : ''}
${companyContext?.companyValues ? `Company Values: ${companyContext.companyValues}` : ''}
${companyContext?.companyDescription ? `Description: ${companyContext.companyDescription}` : ''}

Category: ${categoryName}
${categoryDescription ? `Category Description: ${categoryDescription}` : ''}

Generate competencies that are:
1. Specific to the ${categoryName} category
2. Relevant to the ${companyContext?.industry || 'business'} industry
3. Measurable and observable in performance reviews
4. Aligned with ${companyContext?.companyName || 'the organization'}'s context
5. Professional and actionable

Each competency should have:
- A clear, specific name (3-6 words)
- A detailed description of what the competency means
- The category it belongs to

Return the response as a JSON array with this structure:
[
  {
    "name": "Competency Name",
    "description": "Detailed description of the competency and what it means in practice",
    "category": "${categoryName}"
  }
]`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'competency',
          action: 'generate-by-category',
        },
        {
          temperature: 0.7,
          maxTokens: 2000,
        }
      );

      const competencies = this.orchestrator.parseJSONResponse<Array<{
        name: string;
        description: string;
        category: string;
      }>>(response);

      aiLogger.info('Competencies generated by category', {
        categoryName,
        count: competencies.length,
      });

      return competencies.map(c => ({
        ...c,
        category: c.category || categoryName,
        type: categoryType,
      }));
    } catch (error) {
      aiLogger.error('Failed to generate competencies by category', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate competencies by category');
    }
  }

  /**
   * Infer competency type from category name
   */
  private static inferCompetencyType(categoryName: string): 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL' {
    const lowerName = categoryName.toLowerCase();

    // Leadership indicators
    if (lowerName.includes('leadership') || lowerName.includes('management') ||
        lowerName.includes('strategic') || lowerName.includes('executive')) {
      return 'LEADERSHIP';
    }

    // Core indicators
    if (lowerName.includes('core') || lowerName.includes('fundamental') ||
        lowerName.includes('values') || lowerName.includes('culture')) {
      return 'CORE';
    }

    // Default to functional (technical/industry-specific)
    return 'FUNCTIONAL';
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
