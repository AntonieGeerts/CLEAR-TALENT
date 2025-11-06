import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../types';
import { apiLogger } from '../../utils/logger';
import { CreateCompetencyInput, UpdateCompetencyInput, CompetencyQuery } from '../../utils/validators';

const prisma = new PrismaClient();

// Define CompetencyType enum locally (matches Prisma schema)
enum CompetencyType {
  CORE = 'CORE',
  LEADERSHIP = 'LEADERSHIP',
  FUNCTIONAL = 'FUNCTIONAL',
  TECHNICAL = 'TECHNICAL'
}

export class CompetencyService {
  /**
   * Create a new competency
   */
  static async createCompetency(
    tenantId: string,
    userId: string,
    data: CreateCompetencyInput
  ) {
    try {
      const competency = await prisma.competency.create({
        data: {
          ...data,
          tenantId,
          createdBy: userId,
        },
        include: {
          proficiencyLevels: true,
        },
      });

      apiLogger.info('Competency created', {
        competencyId: competency.id,
        name: competency.name,
      });

      return competency;
    } catch (error) {
      apiLogger.error('Failed to create competency', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get competency by ID
   */
  static async getCompetencyById(competencyId: string, tenantId: string) {
    const competency = await prisma.competency.findFirst({
      where: {
        id: competencyId,
        tenantId,
      },
      include: {
        proficiencyLevels: {
          include: {
            behavioralIndicators: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!competency) {
      throw new NotFoundError('Competency');
    }

    return competency;
  }

  /**
   * List competencies with filters and pagination
   */
  static async listCompetencies(tenantId: string, query: CompetencyQuery) {
    const { type, category, search, page, pageSize } = query;

    const where: any = { tenantId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [competencies, total] = await Promise.all([
      prisma.competency.findMany({
        where,
        include: {
          proficiencyLevels: {
            select: {
              id: true,
              name: true,
              numericLevel: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.competency.count({ where }),
    ]);

    return {
      competencies,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Update competency
   */
  static async updateCompetency(
    competencyId: string,
    tenantId: string,
    data: UpdateCompetencyInput
  ) {
    // Verify competency exists and belongs to tenant
    await this.getCompetencyById(competencyId, tenantId);

    const updated = await prisma.competency.update({
      where: { id: competencyId },
      data,
      include: {
        proficiencyLevels: true,
      },
    });

    apiLogger.info('Competency updated', { competencyId });

    return updated;
  }

  /**
   * Delete competency
   */
  static async deleteCompetency(competencyId: string, tenantId: string) {
    // Verify competency exists and belongs to tenant
    await this.getCompetencyById(competencyId, tenantId);

    await prisma.competency.delete({
      where: { id: competencyId },
    });

    apiLogger.info('Competency deleted', { competencyId });
  }

  /**
   * Create proficiency levels for a competency
   */
  static async createProficiencyLevels(
    competencyId: string,
    tenantId: string,
    levels: Array<{
      name: string;
      numericLevel: number;
      description: string;
      sortOrder: number;
    }>
  ) {
    // Verify competency exists
    await this.getCompetencyById(competencyId, tenantId);

    const created = await prisma.$transaction(
      levels.map((level) =>
        prisma.proficiencyLevel.create({
          data: {
            ...level,
            competencyId,
          },
        })
      )
    );

    apiLogger.info('Proficiency levels created', {
      competencyId,
      count: levels.length,
    });

    return created;
  }

  /**
   * Create behavioral indicators
   */
  static async createBehavioralIndicators(
    competencyId: string,
    levelId: string,
    tenantId: string,
    indicators: Array<{
      description: string;
      examples?: string[];
      sortOrder: number;
    }>
  ) {
    // Verify competency exists
    await this.getCompetencyById(competencyId, tenantId);

    const created = await prisma.$transaction(
      indicators.map((indicator) =>
        prisma.behavioralIndicator.create({
          data: {
            ...indicator,
            competencyId,
            levelId,
            examples: indicator.examples || [],
          },
        })
      )
    );

    apiLogger.info('Behavioral indicators created', {
      competencyId,
      levelId,
      count: indicators.length,
    });

    return created;
  }

  /**
   * Get competencies by type
   */
  static async getCompetenciesByType(tenantId: string, type: CompetencyType) {
    return prisma.competency.findMany({
      where: {
        tenantId,
        type,
      },
      include: {
        proficiencyLevels: {
          select: {
            id: true,
            name: true,
            numericLevel: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

export default CompetencyService;
