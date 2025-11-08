import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

export class CompetencyQuestionService {
  /**
   * Get all questions for a competency
   */
  static async getQuestionsByCompetency(competencyId: string): Promise<any[]> {
    const questions = await prisma.competencyQuestion.findMany({
      where: { competencyId },
      orderBy: { createdAt: 'asc' },
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
        examples: data.examples || [],
        aiGenerated: data.aiGenerated || false,
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
    }
  ): Promise<any> {
    const question = await prisma.competencyQuestion.update({
      where: { id: questionId },
      data: {
        statement: data.statement,
        type: data.type,
        examples: data.examples,
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
            examples: q.examples || [],
            proficiencyLevelId: q.proficiencyLevelId || null,
            ratingOptions: q.ratingOptions || null,
            aiGenerated: true,
          },
        })
      )
    );

    return createdQuestions;
  }
}
