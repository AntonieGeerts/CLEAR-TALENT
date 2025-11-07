import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ScoringSystemService {
  /**
   * Get all scoring systems for a tenant
   */
  static async getAll(tenantId: string): Promise<any[]> {
    const systems = await prisma.scoringSystem.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return systems;
  }

  /**
   * Get a specific scoring system by ID
   */
  static async getById(id: string, tenantId: string): Promise<any> {
    const system = await prisma.scoringSystem.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!system) {
      throw new Error('Scoring system not found');
    }

    return system;
  }

  /**
   * Get the default scoring system for a tenant
   */
  static async getDefault(tenantId: string): Promise<any> {
    const system = await prisma.scoringSystem.findFirst({
      where: {
        tenantId,
        isDefault: true,
      },
    });

    if (!system) {
      // If no default is set, return the first active system
      const fallback = await prisma.scoringSystem.findFirst({
        where: {
          tenantId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });

      if (!fallback) {
        throw new Error('No scoring systems available');
      }

      return fallback;
    }

    return system;
  }

  /**
   * Create a custom scoring system
   */
  static async create(
    tenantId: string,
    data: {
      systemId: string;
      name: string;
      description: string;
      config: any;
    }
  ): Promise<any> {
    // Check if system ID already exists for this tenant
    const existing = await prisma.scoringSystem.findFirst({
      where: {
        tenantId,
        systemId: data.systemId,
      },
    });

    if (existing) {
      throw new Error('Scoring system with this ID already exists');
    }

    const system = await prisma.scoringSystem.create({
      data: {
        tenantId,
        systemId: data.systemId,
        name: data.name,
        description: data.description,
        config: data.config,
        isActive: true,
        isDefault: false,
      },
    });

    return system;
  }

  /**
   * Update a scoring system
   */
  static async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      description?: string;
      config?: any;
      isActive?: boolean;
    }
  ): Promise<any> {
    // Verify ownership
    const existing = await prisma.scoringSystem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error('Scoring system not found');
    }

    const system = await prisma.scoringSystem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        config: data.config,
        isActive: data.isActive,
      },
    });

    return system;
  }

  /**
   * Set a scoring system as the default for a tenant
   */
  static async setDefault(id: string, tenantId: string): Promise<any> {
    // Verify ownership
    const existing = await prisma.scoringSystem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error('Scoring system not found');
    }

    // Transaction to unset other defaults and set this one
    await prisma.$transaction([
      // Unset all defaults for this tenant
      prisma.scoringSystem.updateMany({
        where: { tenantId },
        data: { isDefault: false },
      }),
      // Set this one as default
      prisma.scoringSystem.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    const updated = await prisma.scoringSystem.findUnique({
      where: { id },
    });

    return updated;
  }

  /**
   * Delete a custom scoring system
   * (Cannot delete default systems, only custom ones)
   */
  static async delete(id: string, tenantId: string): Promise<void> {
    const existing = await prisma.scoringSystem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error('Scoring system not found');
    }

    // Prevent deletion if it's the default system
    if (existing.isDefault) {
      throw new Error('Cannot delete the default scoring system. Please set another system as default first.');
    }

    // Check if any questions are using this system
    const questionsUsingSystem = await prisma.competencyQuestion.count({
      where: { scoringSystemId: id },
    });

    if (questionsUsingSystem > 0) {
      throw new Error(
        `Cannot delete scoring system. ${questionsUsingSystem} question(s) are currently using it.`
      );
    }

    await prisma.scoringSystem.delete({
      where: { id },
    });
  }

  /**
   * Calculate score using a specific scoring system
   * This is a placeholder for future implementation
   */
  static async calculateScore(
    systemId: string,
    tenantId: string,
    questionScores: Array<{
      questionId: string;
      score: number;
      weight?: number;
    }>
  ): Promise<{
    totalScore: number;
    breakdown: any;
  }> {
    const system = await prisma.scoringSystem.findFirst({
      where: {
        systemId,
        tenantId,
      },
    });

    if (!system) {
      throw new Error('Scoring system not found');
    }

    // TODO: Implement actual calculation logic based on system.config
    // For now, return a simple weighted average

    let weightedSum = 0;
    let totalWeight = 0;

    for (const qs of questionScores) {
      const weight = qs.weight || 1.0;
      weightedSum += qs.score * weight;
      totalWeight += weight;
    }

    const totalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      totalScore,
      breakdown: {
        questionScores,
        weightedSum,
        totalWeight,
      },
    };
  }
}
