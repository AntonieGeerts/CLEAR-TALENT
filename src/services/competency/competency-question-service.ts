import { PrismaClient, QuestionType, DifficultyLevel } from '@prisma/client';
import { NotFoundError } from '../../types';

const prisma = new PrismaClient();

export interface CreateQuestionInput {
  levelId?: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  questionText: string;
  options?: any;
  correctAnswer?: string;
  explanation?: string;
  tags?: string[];
}

export interface UpdateQuestionInput {
  levelId?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  questionText?: string;
  options?: any;
  correctAnswer?: string;
  explanation?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface QuestionQuery {
  levelId?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class CompetencyQuestionService {
  /**
   * List questions for a competency
   */
  static async listQuestions(competencyId: string, tenantId: string, query: QuestionQuery = {}) {
    const { levelId, questionType, difficulty, isActive = true, page = 1, limit = 50 } = query;

    // Verify competency exists and belongs to tenant
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, tenantId },
    });

    if (!competency) {
      throw new NotFoundError('Competency not found');
    }

    const where: any = { competencyId, isActive };

    if (levelId) where.levelId = levelId;
    if (questionType) where.questionType = questionType;
    if (difficulty) where.difficulty = difficulty;

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.competencyQuestion.findMany({
        where,
        include: {
          level: {
            select: {
              id: true,
              name: true,
              numericLevel: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.competencyQuestion.count({ where }),
    ]);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific question
   */
  static async getQuestionById(questionId: string, competencyId: string, tenantId: string) {
    const question = await prisma.competencyQuestion.findFirst({
      where: {
        id: questionId,
        competencyId,
        competency: { tenantId },
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            numericLevel: true,
          },
        },
        competency: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return question;
  }

  /**
   * Create a question
   */
  static async createQuestion(
    competencyId: string,
    tenantId: string,
    userId: string,
    data: CreateQuestionInput
  ) {
    // Verify competency exists and belongs to tenant
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, tenantId },
    });

    if (!competency) {
      throw new NotFoundError('Competency not found');
    }

    // If levelId is provided, verify it exists
    if (data.levelId) {
      const level = await prisma.proficiencyLevel.findFirst({
        where: { id: data.levelId, competencyId },
      });

      if (!level) {
        throw new NotFoundError('Proficiency level not found');
      }
    }

    const question = await prisma.competencyQuestion.create({
      data: {
        competencyId,
        levelId: data.levelId,
        questionType: data.questionType,
        difficulty: data.difficulty,
        questionText: data.questionText,
        options: data.options || null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        tags: data.tags || [],
        createdBy: userId,
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            numericLevel: true,
          },
        },
      },
    });

    return question;
  }

  /**
   * Create multiple questions (bulk create)
   */
  static async createQuestions(
    competencyId: string,
    tenantId: string,
    userId: string,
    questions: CreateQuestionInput[]
  ) {
    // Verify competency exists and belongs to tenant
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, tenantId },
    });

    if (!competency) {
      throw new NotFoundError('Competency not found');
    }

    const created = await prisma.competencyQuestion.createMany({
      data: questions.map((q) => ({
        competencyId,
        levelId: q.levelId,
        questionType: q.questionType,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        tags: q.tags || [],
        createdBy: userId,
      })),
    });

    return created;
  }

  /**
   * Update a question
   */
  static async updateQuestion(
    questionId: string,
    competencyId: string,
    tenantId: string,
    data: UpdateQuestionInput
  ) {
    // Verify question exists
    const existingQuestion = await this.getQuestionById(questionId, competencyId, tenantId);

    // If levelId is provided, verify it exists
    if (data.levelId) {
      const level = await prisma.proficiencyLevel.findFirst({
        where: { id: data.levelId, competencyId },
      });

      if (!level) {
        throw new NotFoundError('Proficiency level not found');
      }
    }

    const question = await prisma.competencyQuestion.update({
      where: { id: questionId },
      data: {
        levelId: data.levelId,
        questionType: data.questionType,
        difficulty: data.difficulty,
        questionText: data.questionText,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        tags: data.tags,
        isActive: data.isActive,
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            numericLevel: true,
          },
        },
      },
    });

    return question;
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(questionId: string, competencyId: string, tenantId: string) {
    // Verify question exists
    await this.getQuestionById(questionId, competencyId, tenantId);

    await prisma.competencyQuestion.delete({
      where: { id: questionId },
    });
  }

  /**
   * Deactivate a question (soft delete)
   */
  static async deactivateQuestion(questionId: string, competencyId: string, tenantId: string) {
    return this.updateQuestion(questionId, competencyId, tenantId, { isActive: false });
  }
}
