/**
 * Department Service
 *
 * Manages departments for multi-tenant system.
 *
 * Features:
 * - Create, update, delete departments
 * - List departments with filtering
 * - Support for hierarchical departments
 * - Department manager assignment
 *
 * Usage:
 *   const departmentService = new DepartmentService();
 *   const department = await departmentService.createDepartment({
 *     tenantId: 'tenant-123',
 *     name: 'Engineering',
 *     code: 'ENG',
 *     description: 'Engineering Department'
 *   });
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface CreateDepartmentInput {
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ListDepartmentsQuery {
  tenantId: string;
  isActive?: boolean;
  parentId?: string | null;
  search?: string;
}

export class DepartmentService {
  /**
   * Create a new department
   */
  async createDepartment(input: CreateDepartmentInput) {
    const { tenantId, name, code, description, parentId, managerId, metadata } = input;

    try {
      // Check if department with same name already exists for this tenant
      const existing = await prisma.department.findFirst({
        where: {
          tenantId,
          name,
        },
      });

      if (existing) {
        throw new Error(`Department with name "${name}" already exists`);
      }

      // If parentId is provided, verify it exists and belongs to same tenant
      if (parentId) {
        const parent = await prisma.department.findFirst({
          where: {
            id: parentId,
            tenantId,
          },
        });

        if (!parent) {
          throw new Error('Parent department not found or does not belong to this tenant');
        }
      }

      const department = await prisma.department.create({
        data: {
          tenantId,
          name,
          code,
          description,
          parentId,
          managerId,
          metadata: metadata || {},
        },
        include: {
          parent: true,
          children: true,
        },
      });

      logger.info('Department created', {
        departmentId: department.id,
        tenantId,
        name,
      });

      return department;
    } catch (error) {
      logger.error('Failed to create department', { error, input });
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId: string, tenantId: string) {
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  }

  /**
   * List departments for a tenant
   */
  async listDepartments(query: ListDepartmentsQuery) {
    const { tenantId, isActive, parentId, search } = query;

    const where: any = {
      tenantId,
    };

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return departments;
  }

  /**
   * Update a department
   */
  async updateDepartment(
    departmentId: string,
    tenantId: string,
    input: UpdateDepartmentInput
  ) {
    try {
      // Verify department exists and belongs to tenant
      const existing = await this.getDepartmentById(departmentId, tenantId);

      // If name is being changed, check for duplicates
      if (input.name && input.name !== existing.name) {
        const duplicate = await prisma.department.findFirst({
          where: {
            tenantId,
            name: input.name,
            id: { not: departmentId },
          },
        });

        if (duplicate) {
          throw new Error(`Department with name "${input.name}" already exists`);
        }
      }

      // If parentId is being changed, verify it exists and prevent circular references
      if (input.parentId !== undefined && input.parentId !== existing.parentId) {
        if (input.parentId) {
          const parent = await prisma.department.findFirst({
            where: {
              id: input.parentId,
              tenantId,
            },
          });

          if (!parent) {
            throw new Error('Parent department not found or does not belong to this tenant');
          }

          // Prevent setting self as parent or circular references
          if (input.parentId === departmentId) {
            throw new Error('Department cannot be its own parent');
          }

          // Check if the new parent is a descendant (would create a circular reference)
          const isDescendant = await this.isDescendant(departmentId, input.parentId);
          if (isDescendant) {
            throw new Error('Cannot set a descendant as parent (circular reference)');
          }
        }
      }

      const department = await prisma.department.update({
        where: { id: departmentId },
        data: input,
        include: {
          parent: true,
          children: true,
        },
      });

      logger.info('Department updated', {
        departmentId,
        tenantId,
        updates: input,
      });

      return department;
    } catch (error) {
      logger.error('Failed to update department', { error, departmentId, input });
      throw error;
    }
  }

  /**
   * Delete a department (soft delete by setting isActive to false)
   */
  async deleteDepartment(departmentId: string, tenantId: string) {
    try {
      // Verify department exists and belongs to tenant
      await this.getDepartmentById(departmentId, tenantId);

      // Check if department has children
      const children = await prisma.department.count({
        where: {
          parentId: departmentId,
          isActive: true,
        },
      });

      if (children > 0) {
        throw new Error(
          'Cannot delete department with active child departments. Please reassign or delete child departments first.'
        );
      }

      // Soft delete by setting isActive to false
      const department = await prisma.department.update({
        where: { id: departmentId },
        data: {
          isActive: false,
        },
      });

      logger.info('Department deleted', {
        departmentId,
        tenantId,
      });

      return department;
    } catch (error) {
      logger.error('Failed to delete department', { error, departmentId });
      throw error;
    }
  }

  /**
   * Check if a department is a descendant of another department
   */
  private async isDescendant(ancestorId: string, departmentId: string): Promise<boolean> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { parentId: true },
    });

    if (!department || !department.parentId) {
      return false;
    }

    if (department.parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, department.parentId);
  }

  /**
   * Get department hierarchy (all departments organized by parent-child relationships)
   */
  async getDepartmentHierarchy(tenantId: string) {
    const departments = await prisma.department.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        children: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build hierarchy tree (top-level departments only)
    const topLevel = departments.filter((dept) => !dept.parentId);

    return topLevel;
  }
}
