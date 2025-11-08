import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_RATING_OPTIONS: Record<string, string> = {
  '1': 'Never Demonstrated',
  '2': 'Sometimes Demonstrated',
  '3': 'Consistently Demonstrated',
  '4': 'Consistently Demonstrated + shows evidence of higher-level application',
};

const sanitizeRatingOptions = (options?: Record<string, string> | null): Record<string, string> => {
  if (!options || typeof options !== 'object') {
    return { ...DEFAULT_RATING_OPTIONS };
  }

  const normalized = Object.entries(options)
    .filter(([key, value]) => key && typeof value === 'string' && value.trim().length > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .reduce<Record<string, string>>((acc, [key, value], index) => {
      const parsedKey = Number.isNaN(Number(key)) ? index + 1 : Number(key);
      acc[String(parsedKey)] = value.trim();
      return acc;
    }, {});

  return Object.keys(normalized).length > 0 ? normalized : { ...DEFAULT_RATING_OPTIONS };
};

const sanitizeExamples = (examples?: string[] | null): string[] => {
  if (!Array.isArray(examples)) return [];
  return examples
    .map((example) => example?.trim())
    .filter((example): example is string => Boolean(example?.length));
};

export class CompetencyQuestionService {
  /**
   * Get all questions for a competency
   */
  static async getQuestionsByCompetency(competencyId: string): Promise<any[]> {
    const questions = await prisma.competencyQuestion.findMany({
      where: { competencyId },
      include: {
        proficiencyLevel: {
          select: {
            id: true,
            name: true,
            numericLevel: true,
            sortOrder: true,
          },
        },
        scoringSystem: {
          select: {
            id: true,
            name: true,
            systemId: true,
          },
        },
      },
      orderBy: [
        {
          proficiencyLevel: {
            sortOrder: 'asc',
          },
        },
        { createdAt: 'asc' },
      ],
    });

    return questions;
  }

  /**
   * Create a new question for a competency
   */
  static async createQuestion(
    competencyId: string,
    data: {
      statement: string;
      type: QuestionType;
      examples?: string[];
      aiGenerated?: boolean;
      proficiencyLevelId?: string | null;
      ratingOptions?: Record<string, string> | null;
      weight?: number | null;
      scoreMin?: number | null;
      scoreMax?: number | null;
      scoringSystemId?: string | null;
    }
  ): Promise<any> {
    // Verify competency exists
    const competency = await prisma.competency.findUnique({
      where: { id: competencyId },
    });

    if (!competency) {
      throw new Error('Competency not found');
    }

    const question = await prisma.competencyQuestion.create({
      data: {
        competencyId,
        statement: data.statement,
        type: data.type,
        examples: sanitizeExamples(data.examples),
        aiGenerated: data.aiGenerated || false,
        proficiencyLevelId: data.proficiencyLevelId || null,
        ratingOptions: sanitizeRatingOptions(data.ratingOptions),
        weight: data.weight ?? 1.0,
        scoreMin: data.scoreMin ?? 1,
        scoreMax: data.scoreMax ?? 5,
        scoringSystemId: data.scoringSystemId || null,
      },
    });

    return question;
  }

  /**
   * Update a question
   */
  static async updateQuestion(
    questionId: string,
    data: {
      statement?: string;
      type?: QuestionType;
      examples?: string[];
      proficiencyLevelId?: string | null;
      ratingOptions?: Record<string, string> | null;
      weight?: number | null;
      scoreMin?: number | null;
      scoreMax?: number | null;
      scoringSystemId?: string | null;
    }
  ): Promise<any> {
    const question = await prisma.competencyQuestion.update({
      where: { id: questionId },
      data: {
        statement: data.statement,
        type: data.type,
        examples: data.examples ? sanitizeExamples(data.examples) : undefined,
        proficiencyLevelId: data.proficiencyLevelId,
        ratingOptions: data.ratingOptions ? sanitizeRatingOptions(data.ratingOptions) : undefined,
        weight: data.weight ?? undefined,
        scoreMin: data.scoreMin ?? undefined,
        scoreMax: data.scoreMax ?? undefined,
        scoringSystemId: data.scoringSystemId,
      },
    });

    return question;
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    await prisma.competencyQuestion.delete({
      where: { id: questionId },
    });
  }

  /**
   * Bulk create questions (for AI generation)
   */
  static async bulkCreateQuestions(
    competencyId: string,
    questions: Array<{
      statement: string;
      type: QuestionType;
      examples?: string[];
      proficiencyLevelId?: string;
      ratingOptions?: any;
      weight?: number;
      scoreMin?: number;
      scoreMax?: number;
    }>
  ): Promise<any[]> {
    // Verify competency exists
    const competency = await prisma.competency.findUnique({
      where: { id: competencyId },
    });

    if (!competency) {
      throw new Error('Competency not found');
    }

    const createdQuestions = await Promise.all(
      questions.map((q) =>
        prisma.competencyQuestion.create({
          data: {
            competencyId,
            statement: q.statement,
            type: q.type,
            examples: sanitizeExamples(q.examples),
            proficiencyLevelId: q.proficiencyLevelId || null,
            ratingOptions: sanitizeRatingOptions(q.ratingOptions),
            weight: q.weight ?? 1.0,
            scoreMin: q.scoreMin ?? 1,
            scoreMax: q.scoreMax ?? 5,
            aiGenerated: true,
          },
        })
      )
    );

    return createdQuestions;
  }
}
