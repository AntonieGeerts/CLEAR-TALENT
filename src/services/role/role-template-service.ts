import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../types';
import { apiLogger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface RoleTemplateData {
  title: string;
  department: string;
  seniority: string;
  description: string;
  competencies: Array<{
    competencyId: string;
    requiredLevelId: string;
    isMandatory: boolean;
  }>;
}

export class RoleTemplateService {
  /**
   * Create role profile template
   */
  static async createRoleProfile(
    tenantId: string,
    userId: string,
    data: RoleTemplateData
  ) {
    try {
      const roleProfile = await prisma.roleProfile.create({
        data: {
          tenantId,
          createdBy: userId,
          title: data.title,
          department: data.department,
          seniority: data.seniority as any,
          description: data.description,
          roleCompetencies: {
            create: data.competencies.map((comp) => ({
              competencyId: comp.competencyId,
              requiredLevel: comp.requiredLevelId,
              isMandatory: comp.isMandatory,
            })),
          },
        },
        include: {
          roleCompetencies: {
            include: {
              competency: true,
              level: true,
            },
          },
        },
      });

      apiLogger.info('Role profile created', {
        roleProfileId: roleProfile.id,
        title: roleProfile.title,
      });

      return roleProfile;
    } catch (error) {
      apiLogger.error('Failed to create role profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get role profile by ID
   */
  static async getRoleProfileById(roleProfileId: string, tenantId: string) {
    const roleProfile = await prisma.roleProfile.findFirst({
      where: {
        id: roleProfileId,
        tenantId,
      },
      include: {
        roleCompetencies: {
          include: {
            competency: {
              include: {
                proficiencyLevels: true,
              },
            },
            level: true,
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

    if (!roleProfile) {
      throw new NotFoundError('Role profile');
    }

    return roleProfile;
  }

  /**
   * List role profiles
   */
  static async listRoleProfiles(
    tenantId: string,
    options: {
      department?: string;
      seniority?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const { department, seniority, search, page = 1, pageSize = 20 } = options;

    const where: any = { tenantId };

    if (department) where.department = department;
    if (seniority) where.seniority = seniority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [roleProfiles, total] = await Promise.all([
      prisma.roleProfile.findMany({
        where,
        include: {
          roleCompetencies: {
            include: {
              competency: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  description: true,
                },
              },
              level: {
                select: {
                  id: true,
                  name: true,
                  numericLevel: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.roleProfile.count({ where }),
    ]);

    return {
      roleProfiles,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Update role profile (creates new version)
   */
  static async updateRoleProfile(
    roleProfileId: string,
    tenantId: string,
    userId: string,
    data: Partial<RoleTemplateData>
  ) {
    const existing = await this.getRoleProfileById(roleProfileId, tenantId);

    // Create new version
    const updated = await prisma.roleProfile.create({
      data: {
        tenantId,
        createdBy: userId,
        title: data.title || existing.title,
        department: data.department || existing.department,
        seniority: (data.seniority as any) || existing.seniority,
        description: data.description || existing.description,
        version: existing.version + 1,
        roleCompetencies: {
          create: data.competencies
            ? data.competencies.map((comp) => ({
                competencyId: comp.competencyId,
                requiredLevel: comp.requiredLevelId,
                isMandatory: comp.isMandatory,
              }))
            : existing.roleCompetencies.map((rc) => ({
                competencyId: rc.competencyId,
                requiredLevel: rc.requiredLevel,
                isMandatory: rc.isMandatory,
              })),
        },
      },
      include: {
        roleCompetencies: {
          include: {
            competency: true,
            level: true,
          },
        },
      },
    });

    apiLogger.info('Role profile updated (new version created)', {
      roleProfileId: updated.id,
      version: updated.version,
    });

    return updated;
  }

  /**
   * Delete role profile
   */
  static async deleteRoleProfile(roleProfileId: string, tenantId: string) {
    await this.getRoleProfileById(roleProfileId, tenantId);

    await prisma.roleProfile.delete({
      where: { id: roleProfileId },
    });

    apiLogger.info('Role profile deleted', { roleProfileId });
  }

  /**
   * Clone role profile as template
   */
  static async cloneRoleProfile(
    roleProfileId: string,
    tenantId: string,
    userId: string,
    newTitle: string
  ) {
    const existing = await this.getRoleProfileById(roleProfileId, tenantId);

    const cloned = await prisma.roleProfile.create({
      data: {
        tenantId,
        createdBy: userId,
        title: newTitle,
        department: existing.department,
        seniority: existing.seniority,
        description: existing.description,
        version: 1,
        roleCompetencies: {
          create: existing.roleCompetencies.map((rc) => ({
            competencyId: rc.competencyId,
            requiredLevel: rc.requiredLevel,
            isMandatory: rc.isMandatory,
          })),
        },
      },
      include: {
        roleCompetencies: {
          include: {
            competency: true,
            level: true,
          },
        },
      },
    });

    apiLogger.info('Role profile cloned', {
      originalId: roleProfileId,
      clonedId: cloned.id,
    });

    return cloned;
  }
}

export default RoleTemplateService;
