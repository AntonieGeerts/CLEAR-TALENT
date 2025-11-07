import { PrismaClient, QuestionType, DifficultyLevel } from '@prisma/client';
import { LLMOrchestrator } from '../ai/orchestrator';
import { NotFoundError } from '../../types';
import { CompetencyQuestionService, CreateQuestionInput } from './competency-question-service';

const prisma = new PrismaClient();

export interface GenerateQuestionsInput {
  levelId?: string;
  questionTypes?: QuestionType[];
  count?: number;
  difficulty?: DifficultyLevel;
  includeScenarios?: boolean;
}

interface GeneratedQuestion {
  questionType: string;
  difficulty: string;
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  tags?: string[];
}

export class AIQuestionService {
  /**
   * Map question type string from AI to enum
   */
  private static mapQuestionType(type: string): QuestionType {
    const typeMap: Record<string, QuestionType> = {
      multiple_choice: 'MULTIPLE_CHOICE',
      'multiple-choice': 'MULTIPLE_CHOICE',
      multiple: 'MULTIPLE_CHOICE',
      true_false: 'TRUE_FALSE',
      'true-false': 'TRUE_FALSE',
      boolean: 'TRUE_FALSE',
      scenario_based: 'SCENARIO_BASED',
      'scenario-based': 'SCENARIO_BASED',
      scenario: 'SCENARIO_BASED',
      behavioral: 'BEHAVIORAL',
      situational: 'SITUATIONAL',
    };

    const normalized = type.toLowerCase().replace(/\s+/g, '_');
    return typeMap[normalized] || 'MULTIPLE_CHOICE';
  }

  /**
   * Map difficulty string from AI to enum
   */
  private static mapDifficulty(difficulty: string): DifficultyLevel {
    const difficultyMap: Record<string, DifficultyLevel> = {
      basic: 'BASIC',
      beginner: 'BASIC',
      intermediate: 'INTERMEDIATE',
      advanced: 'ADVANCED',
      expert: 'EXPERT',
      master: 'MASTER',
    };

    const normalized = difficulty.toLowerCase();
    return difficultyMap[normalized] || 'INTERMEDIATE';
  }

  /**
   * Generate assessment questions using AI
   */
  static async generateQuestions(
    competencyId: string,
    tenantId: string,
    userId: string,
    input: GenerateQuestionsInput
  ) {
    const {
      levelId,
      questionTypes = ['MULTIPLE_CHOICE', 'SCENARIO_BASED', 'BEHAVIORAL'],
      count = 5,
      difficulty,
      includeScenarios = true,
    } = input;

    // Get competency details
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, tenantId },
      include: {
        proficiencyLevels: {
          orderBy: { numericLevel: 'asc' },
        },
        behavioralIndicators: true,
      },
    });

    if (!competency) {
      throw new NotFoundError('Competency not found');
    }

    // Get specific level if provided
    let targetLevel: typeof competency.proficiencyLevels[0] | undefined = undefined;
    if (levelId) {
      targetLevel = competency.proficiencyLevels.find((l) => l.id === levelId);
      if (!targetLevel) {
        throw new NotFoundError('Proficiency level not found');
      }
    }

    // Build AI prompt
    const levelContext = targetLevel
      ? `Focus on the "${targetLevel.name}" proficiency level (level ${targetLevel.numericLevel}).`
      : `Generate questions across all proficiency levels.`;

    const indicatorsContext =
      competency.behavioralIndicators.length > 0
        ? `\n\nBehavioral Indicators:\n${competency.behavioralIndicators
            .map((ind) => `- ${ind.description}`)
            .join('\n')}`
        : '';

    const questionTypesContext = questionTypes.join(', ');

    const prompt = `Generate ${count} assessment questions for evaluating the competency "${competency.name}" (${competency.type}).

Competency Description: ${competency.description}
${levelContext}
${indicatorsContext}

Question Types to Generate: ${questionTypesContext}
${difficulty ? `Difficulty Level: ${difficulty}` : 'Mix difficulty levels appropriately'}
${includeScenarios ? 'Include realistic workplace scenarios where appropriate.' : ''}

For each question, provide:
1. questionType: The type of question (${questionTypesContext})
2. difficulty: The difficulty level (BASIC, INTERMEDIATE, ADVANCED, EXPERT, or MASTER)
3. questionText: The question text
4. options: Array of answer options (for multiple choice questions)
5. correctAnswer: The correct answer or expected response
6. explanation: Why this is the correct answer and what it demonstrates
7. tags: Relevant tags for categorization

Return the response as a JSON array of question objects.`;

    const orchestrator = LLMOrchestrator.getInstance();

    const aiResponse = await orchestrator.generateCompletion(
      prompt,
      {
        tenantId,
        userId,
        module: 'competency',
        action: 'generate-assessment-questions',
      }
    );

    // Parse AI response
    let generatedQuestions: GeneratedQuestion[];
    try {
      const parsed = orchestrator.parseJSONResponse(aiResponse);
      generatedQuestions = Array.isArray(parsed) ? parsed : (parsed as any).questions || [];
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }

    // Transform to CreateQuestionInput format
    const questions: CreateQuestionInput[] = generatedQuestions.map((q) => ({
      levelId: levelId || undefined,
      questionType: this.mapQuestionType(q.questionType),
      difficulty: this.mapDifficulty(q.difficulty),
      questionText: q.questionText,
      options: q.options ? { options: q.options } : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      tags: q.tags || [],
    }));

    return {
      questions,
      metadata: {
        competencyId,
        competencyName: competency.name,
        levelId: levelId || undefined,
        levelName: targetLevel?.name || undefined,
        generatedCount: questions.length,
      },
    };
  }

  /**
   * Generate and save assessment questions
   */
  static async generateAndSaveQuestions(
    competencyId: string,
    tenantId: string,
    userId: string,
    input: GenerateQuestionsInput
  ) {
    // Generate questions using AI
    const { questions, metadata } = await this.generateQuestions(
      competencyId,
      tenantId,
      userId,
      input
    );

    // Save to database
    const created = await CompetencyQuestionService.createQuestions(
      competencyId,
      tenantId,
      userId,
      questions
    );

    return {
      created,
      metadata,
    };
  }

  /**
   * Regenerate specific question
   */
  static async regenerateQuestion(
    questionId: string,
    competencyId: string,
    tenantId: string,
    userId: string
  ) {
    // Get existing question
    const existingQuestion = await CompetencyQuestionService.getQuestionById(
      questionId,
      competencyId,
      tenantId
    );

    // Generate new version with same parameters
    const { questions } = await this.generateQuestions(competencyId, tenantId, userId, {
      levelId: existingQuestion.levelId || undefined,
      questionTypes: [existingQuestion.questionType],
      count: 1,
      difficulty: existingQuestion.difficulty,
    });

    if (questions.length === 0) {
      throw new Error('Failed to generate replacement question');
    }

    // Update existing question
    const updated = await CompetencyQuestionService.updateQuestion(
      questionId,
      competencyId,
      tenantId,
      questions[0]
    );

    return updated;
  }
}
