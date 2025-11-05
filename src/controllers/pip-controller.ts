import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { ValidationError, AuthorizationError } from '../types';

const prisma = new PrismaClient();

export class PIPController {
  /**
   * Get all PIPs (filtered by role and permissions)
   */
  static async getPIPs(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const { status, employeeId } = req.query;

    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Employees can only see their own PIPs
    if (userRole === 'EMPLOYEE') {
      where.employeeId = userId;
    }

    // Managers can see PIPs for their direct reports
    if (userRole === 'MANAGER') {
      where.OR = [
        { employeeId: userId },
        { managerId: userId },
      ];
    }

    const pips = await prisma.performanceImprovementPlan.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: pips,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get single PIP details
   */
  static async getPIP(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const pip = await prisma.performanceImprovementPlan.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
    });

    if (!pip) {
      return res.status(404).json({
        success: false,
        error: 'Performance Improvement Plan not found',
      });
    }

    // Check permissions
    const canView =
      userRole === 'ADMIN' ||
      userRole === 'HR_MANAGER' ||
      userRole === 'DEPARTMENT_HEAD' ||
      pip.employeeId === userId ||
      pip.managerId === userId;

    if (!canView) {
      throw new AuthorizationError('Insufficient permissions to view this PIP');
    }

    res.json({
      success: true,
      data: pip,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create Performance Improvement Plan
   */
  static async createPIP(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;
    const managerId = req.user!.id;
    const userRole = req.user!.role;

    // Only ADMIN, HR_MANAGER, DEPARTMENT_HEAD, or MANAGER can create PIPs
    const allowedRoles = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER'];
    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError('Insufficient permissions to create PIPs');
    }

    const {
      employeeId,
      startDate,
      endDate,
      objectives,
      metadata = {},
    } = req.body;

    if (!employeeId || !startDate || !endDate || !objectives) {
      throw new ValidationError('Employee ID, start date, end date, and objectives are required');
    }

    // Validate employee exists
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      throw new ValidationError('Employee not found');
    }

    // Check if employee already has an active PIP
    const activePIP = await prisma.performanceImprovementPlan.findFirst({
      where: {
        employeeId,
        tenantId,
        status: { in: ['ACTIVE', 'ON_TRACK', 'AT_RISK'] },
      },
    });

    if (activePIP) {
      throw new ValidationError('Employee already has an active PIP');
    }

    const pip = await prisma.performanceImprovementPlan.create({
      data: {
        tenantId,
        employeeId,
        managerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        objectives,
        metadata,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: pip,
      message: 'Performance Improvement Plan created successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update PIP
   */
  static async updatePIP(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const pip = await prisma.performanceImprovementPlan.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!pip) {
      return res.status(404).json({
        success: false,
        error: 'PIP not found',
      });
    }

    // Only manager, admin, or HR can update
    const canUpdate =
      userRole === 'ADMIN' ||
      userRole === 'HR_MANAGER' ||
      userRole === 'DEPARTMENT_HEAD' ||
      pip.managerId === userId;

    if (!canUpdate) {
      throw new AuthorizationError('Insufficient permissions to update this PIP');
    }

    const {
      status,
      objectives,
      checkIns,
      finalOutcome,
      closureDate,
      metadata,
    } = req.body;

    const updatedPIP = await prisma.performanceImprovementPlan.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(objectives && { objectives }),
        ...(checkIns && { checkIns }),
        ...(finalOutcome !== undefined && { finalOutcome }),
        ...(closureDate && { closureDate: new Date(closureDate) }),
        ...(metadata && { metadata }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPIP,
      message: 'PIP updated successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add check-in to PIP
   */
  static async addCheckIn(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const pip = await prisma.performanceImprovementPlan.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!pip) {
      return res.status(404).json({
        success: false,
        error: 'PIP not found',
      });
    }

    const { date, notes, progress, actionItems = [] } = req.body;

    if (!date || !notes || progress === undefined) {
      throw new ValidationError('Date, notes, and progress are required');
    }

    const checkIns = Array.isArray(pip.checkIns) ? pip.checkIns : [];

    const newCheckIn = {
      date: new Date(date).toISOString(),
      notes,
      progress,
      actionItems,
      recordedBy: userId,
      recordedAt: new Date().toISOString(),
    };

    const updatedPIP = await prisma.performanceImprovementPlan.update({
      where: { id },
      data: {
        checkIns: [...checkIns, newCheckIn],
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPIP,
      message: 'Check-in added successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Complete PIP
   */
  static async completePIP(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;
    const userRole = req.user!.role;

    // Only ADMIN, HR_MANAGER, or DEPARTMENT_HEAD can complete PIPs
    const allowedRoles = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'];
    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError('Insufficient permissions to complete PIPs');
    }

    const pip = await prisma.performanceImprovementPlan.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!pip) {
      return res.status(404).json({
        success: false,
        error: 'PIP not found',
      });
    }

    const { finalOutcome, successful } = req.body;

    if (!finalOutcome) {
      throw new ValidationError('Final outcome is required');
    }

    const updatedPIP = await prisma.performanceImprovementPlan.update({
      where: { id },
      data: {
        status: successful ? 'COMPLETED' : 'TERMINATED',
        finalOutcome,
        closureDate: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPIP,
      message: 'PIP completed successfully',
      timestamp: new Date().toISOString(),
    });
  }
}
