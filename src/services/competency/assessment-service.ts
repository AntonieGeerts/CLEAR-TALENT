import { PrismaClient, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAssessmentInput {
  tenantId: string;
  userId: string;
  competencyIds: string[];
}

export interface SubmitResponseInput {
  questionId: string;
  rating: number;
  comment?: string;
}

export interface AssessmentResults {
  assessmentId: string;
  status: AssessmentStatus;
  totalQuestions: number;
  answeredCount: number;
  totalScore: number;
  averageScore: number;
  competencyBreakdown: Array<{
    competencyId: string;
    competencyName: string;
    questionsCount: number;
    averageScore: number;
    responses: Array<{
      questionId: string;
      statement: string;
      rating: number;
      score: number;
      comment?: string;
    }>;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

export class AssessmentService {
  /**
   * Create a new assessment session
   */
  static async createAssessment(input: CreateAssessmentInput): Promise<any> {
    const { tenantId, userId, competencyIds } = input;

    // Verify competencies exist and belong to tenant
    const competencies = await prisma.competency.findMany({
      where: {
        id: { in: competencyIds },
        tenantId,
      },
    });

    if (competencies.length !== competencyIds.length) {
      throw new Error('Some competencies not found or do not belong to this tenant');
    }

    // Get all questions for these competencies
    const questions = await prisma.competencyQuestion.findMany({
      where: {
        competencyId: { in: competencyIds },
      },
    });

    if (questions.length === 0) {
      throw new Error('No questions found for the selected competencies');
    }

    // Create assessment
    const assessment = await prisma.competencyAssessment.create({
      data: {
        tenantId,
        userId,
        competencyIds,
        totalQuestions: questions.length,
        answeredCount: 0,
        status: 'IN_PROGRESS',
      },
    });

    return {
      ...assessment,
      questions: questions.map((q) => ({
        id: q.id,
        competencyId: q.competencyId,
        statement: q.statement,
        type: q.type,
        examples: q.examples,
      })),
    };
  }

  /**
   * Get assessment by ID with questions and responses
   */
  static async getAssessment(assessmentId: string, tenantId: string): Promise<any> {
    const assessment = await prisma.competencyAssessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
      },
      include: {
        responses: {
          include: {
            question: {
              include: {
                competency: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get all questions for this assessment
    const questions = await prisma.competencyQuestion.findMany({
      where: {
        competencyId: { in: assessment.competencyIds },
      },
      include: {
        competency: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Map responses to questions
    const questionsWithResponses = questions.map((q) => {
      const response = assessment.responses.find((r) => r.questionId === q.id);
      return {
        id: q.id,
        competencyId: q.competencyId,
        competencyName: q.competency.name,
        statement: q.statement,
        type: q.type,
        examples: q.examples,
        response: response
          ? {
              rating: response.rating,
              comment: response.comment,
              score: response.score,
            }
          : null,
      };
    });

    return {
      id: assessment.id,
      status: assessment.status,
      competencyIds: assessment.competencyIds,
      totalQuestions: assessment.totalQuestions,
      answeredCount: assessment.answeredCount,
      totalScore: assessment.totalScore,
      averageScore: assessment.averageScore,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt,
      questions: questionsWithResponses,
    };
  }

  /**
   * Submit a response to a question
   */
  static async submitResponse(
    assessmentId: string,
    tenantId: string,
    input: SubmitResponseInput
  ): Promise<any> {
    const { questionId, rating, comment } = input;

    // Verify assessment exists and is in progress
    const assessment = await prisma.competencyAssessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        status: 'IN_PROGRESS',
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found or not in progress');
    }

    // Verify question exists
    const question = await prisma.competencyQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Verify question belongs to one of the assessment's competencies
    if (!assessment.competencyIds.includes(question.competencyId)) {
      throw new Error('Question does not belong to this assessment');
    }

    // Calculate score (simple linear mapping for now)
    // Could be enhanced with scoring system logic
    const scoreMin = question.scoreMin || 1;
    const scoreMax = question.scoreMax || 5;
    const weight = question.weight || 1.0;

    // Normalize rating to 0-1 range, then scale to score range
    const normalizedRating = (rating - 1) / 4; // Assuming 1-5 scale
    const score = scoreMin + normalizedRating * (scoreMax - scoreMin);
    const weightedScore = score * weight;

    // Upsert response (update if exists, create if not)
    const response = await prisma.assessmentResponse.upsert({
      where: {
        assessmentId_questionId: {
          assessmentId,
          questionId,
        },
      },
      update: {
        rating,
        comment: comment || null,
        score: weightedScore,
      },
      create: {
        assessmentId,
        questionId,
        rating,
        comment: comment || null,
        score: weightedScore,
      },
    });

    // Update assessment answered count
    const answeredCount = await prisma.assessmentResponse.count({
      where: { assessmentId },
    });

    await prisma.competencyAssessment.update({
      where: { id: assessmentId },
      data: { answeredCount },
    });

    return response;
  }

  /**
   * Complete assessment and calculate final scores
   */
  static async completeAssessment(
    assessmentId: string,
    tenantId: string
  ): Promise<AssessmentResults> {
    const assessment = await prisma.competencyAssessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
      },
      include: {
        responses: {
          include: {
            question: {
              include: {
                competency: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.status === 'COMPLETED') {
      throw new Error('Assessment already completed');
    }

    // Calculate total and average scores
    const totalScore = assessment.responses.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore =
      assessment.responses.length > 0 ? totalScore / assessment.responses.length : 0;

    // Calculate competency breakdown
    const competencyMap = new Map<string, any>();

    for (const response of assessment.responses) {
      const compId = response.question.competencyId;
      if (!competencyMap.has(compId)) {
        competencyMap.set(compId, {
          competencyId: compId,
          competencyName: response.question.competency.name,
          responses: [],
          totalScore: 0,
          count: 0,
        });
      }

      const comp = competencyMap.get(compId);
      comp.responses.push({
        questionId: response.questionId,
        statement: response.question.statement,
        rating: response.rating,
        score: response.score || 0,
        comment: response.comment,
      });
      comp.totalScore += response.score || 0;
      comp.count += 1;
    }

    const competencyBreakdown = Array.from(competencyMap.values()).map((comp) => ({
      competencyId: comp.competencyId,
      competencyName: comp.competencyName,
      questionsCount: comp.count,
      averageScore: comp.count > 0 ? comp.totalScore / comp.count : 0,
      responses: comp.responses,
    }));

    const results = {
      competencyBreakdown,
      summary: {
        totalQuestions: assessment.totalQuestions,
        answeredCount: assessment.answeredCount,
        completionRate: (assessment.answeredCount / assessment.totalQuestions) * 100,
      },
    };

    // Update assessment
    const updatedAssessment = await prisma.competencyAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalScore,
        averageScore,
        results,
      },
    });

    return {
      assessmentId: updatedAssessment.id,
      status: updatedAssessment.status,
      totalQuestions: updatedAssessment.totalQuestions,
      answeredCount: updatedAssessment.answeredCount,
      totalScore,
      averageScore,
      competencyBreakdown,
      startedAt: updatedAssessment.startedAt,
      completedAt: updatedAssessment.completedAt ?? undefined,
    };
  }

  /**
   * Get user's assessment history
   */
  static async getUserAssessments(userId: string, tenantId: string): Promise<any[]> {
    const assessments = await prisma.competencyAssessment.findMany({
      where: {
        userId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assessments;
  }

  /**
   * Get assessment results
   */
  static async getAssessmentResults(
    assessmentId: string,
    tenantId: string
  ): Promise<AssessmentResults> {
    const assessment = await prisma.competencyAssessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        status: 'COMPLETED',
      },
      include: {
        responses: {
          include: {
            question: {
              include: {
                competency: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found or not completed');
    }

    // Build competency breakdown from stored results or calculate on the fly
    let competencyBreakdown: any[] = [];

    if (assessment.results && typeof assessment.results === 'object') {
      const results = assessment.results as any;
      competencyBreakdown = results.competencyBreakdown || [];
    } else {
      // Calculate breakdown
      const competencyMap = new Map<string, any>();

      for (const response of assessment.responses) {
        const compId = response.question.competencyId;
        if (!competencyMap.has(compId)) {
          competencyMap.set(compId, {
            competencyId: compId,
            competencyName: response.question.competency.name,
            responses: [],
            totalScore: 0,
            count: 0,
          });
        }

        const comp = competencyMap.get(compId);
        comp.responses.push({
          questionId: response.questionId,
          statement: response.question.statement,
          rating: response.rating,
          score: response.score || 0,
          comment: response.comment,
        });
        comp.totalScore += response.score || 0;
        comp.count += 1;
      }

      competencyBreakdown = Array.from(competencyMap.values()).map((comp) => ({
        competencyId: comp.competencyId,
        competencyName: comp.competencyName,
        questionsCount: comp.count,
        averageScore: comp.count > 0 ? comp.totalScore / comp.count : 0,
        responses: comp.responses,
      }));
    }

    return {
      assessmentId: assessment.id,
      status: assessment.status,
      totalQuestions: assessment.totalQuestions,
      answeredCount: assessment.answeredCount,
      totalScore: assessment.totalScore || 0,
      averageScore: assessment.averageScore || 0,
      competencyBreakdown,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt || undefined,
    };
  }
}
