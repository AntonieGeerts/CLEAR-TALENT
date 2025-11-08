/**
 * Approval Flow Service
 *
 * Manages approval workflow configuration for multi-step approval processes.
 *
 * Features:
 * - Define multi-step approval workflows
 * - Configure approval steps with role/user/dynamic approvers
 * - Version control for flow definitions
 * - Activate/deactivate flows
 * - SLA tracking per step
 * - Support for parallel and sequential approvals
 *
 * Usage:
 *   const flowService = new ApprovalFlowService();
 *   const flow = await flowService.createFlow({
 *     tenantId: 'tenant-123',
 *     name: 'Promotion Request',
 *     key: 'promotion_request',
 *     targetResource: 'performance_review',
 *     steps: [
 *       { approverType: 'DYNAMIC', dynamicRule: { type: 'manager' }, orderIndex: 1 },
 *       { approverType: 'ROLE', approverRoleId: 'hr-role-id', orderIndex: 2 }
 *     ],
 *     createdBy: 'user-456'
 *   });
 */

import { PrismaClient, ApproverType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AuditService, AuditEventTypes } from './audit-service';

const prisma = new PrismaClient();

export interface CreateApprovalStepInput {
  orderIndex: number;
  approverType: ApproverType;
  approverRoleId?: string;
  approverUserId?: string;
  dynamicRule?: Record<string, any>; // e.g., { type: 'manager_of_requester' }
  minApprovals?: number; // For parallel approvals
  slaHours?: number; // Service level agreement
}

export interface CreateApprovalFlowInput {
  tenantId: string;
  name: string;
  key: string; // Unique identifier like 'promotion_request'
  description?: string;
  targetResource: string; // e.g., 'performance_review', 'development_plan'
  steps: CreateApprovalStepInput[];
  createdBy: string; // userId for audit
}

export interface UpdateApprovalFlowInput {
  flowId: string;
  tenantId: string;
  name?: string;
  description?: string;
  updatedBy: string; // userId for audit
}

export interface AddApprovalStepInput {
  flowId: string;
  tenantId: string;
  step: CreateApprovalStepInput;
  updatedBy: string;
}

export interface UpdateApprovalStepInput {
  stepId: string;
  flowId: string;
  tenantId: string;
  approverType?: ApproverType;
  approverRoleId?: string | null;
  approverUserId?: string | null;
  dynamicRule?: Record<string, any> | null;
  minApprovals?: number;
  slaHours?: number | null;
  updatedBy: string;
}

export interface ReorderStepsInput {
  flowId: string;
  tenantId: string;
  stepOrdering: Array<{ stepId: string; orderIndex: number }>;
  updatedBy: string;
}

export interface ApprovalFlowWithSteps {
  id: string;
  tenantId: string;
  name: string;
  key: string;
  description: string | null;
  targetResource: string;
  isActive: boolean;
  version: number;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  steps: Array<{
    id: string;
    orderIndex: number;
    approverType: ApproverType;
    approverRoleId: string | null;
    approverRoleName?: string;
    approverUserId: string | null;
    approverUserName?: string;
    dynamicRule: Record<string, any> | null;
    minApprovals: number;
    slaHours: number | null;
  }>;
}

export class ApprovalFlowService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Create a new approval flow with steps
   */
  async createFlow(
    input: CreateApprovalFlowInput
  ): Promise<ApprovalFlowWithSteps> {
    const {
      tenantId,
      name,
      key,
      description,
      targetResource,
      steps,
      createdBy,
    } = input;

    try {
      // Check if key already exists for this tenant
      const existing = await prisma.approvalFlowDefinition.findFirst({
        where: {
          tenantId,
          key,
        },
      });

      if (existing) {
        throw new Error(
          `Approval flow with key '${key}' already exists for this tenant`
        );
      }

      // Validate steps
      if (!steps || steps.length === 0) {
        throw new Error('At least one approval step is required');
      }

      // Validate approver configuration for each step
      for (const step of steps) {
        this.validateStepConfiguration(step);
      }

      // Create flow with steps in transaction
      const flow = await prisma.$transaction(async (tx) => {
        // Create flow definition
        const newFlow = await tx.approvalFlowDefinition.create({
          data: {
            tenantId,
            name,
            key,
            description,
            targetResource,
            isActive: false, // Start as inactive
            version: 1,
            createdByUserId: createdBy,
          },
        });

        // Create steps
        await tx.approvalStep.createMany({
          data: steps.map((step) => ({
            flowId: newFlow.id,
            orderIndex: step.orderIndex,
            approverType: step.approverType,
            approverRoleId: step.approverRoleId,
            approverUserId: step.approverUserId,
            dynamicRule: step.dynamicRule ? step.dynamicRule : undefined,
            minApprovals: step.minApprovals || 1,
            slaHours: step.slaHours,
          })),
        });

        return newFlow;
      });

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_CREATED,
        tenantId,
        createdBy,
        flow.id,
        {
          name,
          key,
          stepCount: steps.length,
        }
      );

      logger.info('Approval flow created', {
        flowId: flow.id,
        tenantId,
        key,
      });

      return this.getFlowById(flow.id, tenantId);
    } catch (error) {
      logger.error('Failed to create approval flow', { error, input });
      throw error;
    }
  }

  /**
   * Get approval flow by ID with all steps
   */
  async getFlowById(
    flowId: string,
    tenantId: string
  ): Promise<ApprovalFlowWithSteps> {
    const flow = await prisma.approvalFlowDefinition.findFirst({
      where: {
        id: flowId,
        tenantId,
      },
      include: {
        steps: {
          include: {
            approverRole: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!flow) {
      throw new Error(`Approval flow not found: ${flowId}`);
    }

    // Get user names for user-based approvers
    const userIds = flow.steps
      .filter((s) => s.approverUserId)
      .map((s) => s.approverUserId!);

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];

    const userMap = new Map(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`])
    );

    return {
      id: flow.id,
      tenantId: flow.tenantId,
      name: flow.name,
      key: flow.key,
      description: flow.description,
      targetResource: flow.targetResource,
      isActive: flow.isActive,
      version: flow.version,
      createdByUserId: flow.createdByUserId,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      steps: flow.steps.map((step) => ({
        id: step.id,
        orderIndex: step.orderIndex,
        approverType: step.approverType,
        approverRoleId: step.approverRoleId,
        approverRoleName: step.approverRole?.name,
        approverUserId: step.approverUserId,
        approverUserName: step.approverUserId
          ? userMap.get(step.approverUserId)
          : undefined,
        dynamicRule: step.dynamicRule as Record<string, any> | null,
        minApprovals: step.minApprovals,
        slaHours: step.slaHours,
      })),
    };
  }

  /**
   * Get approval flow by key
   */
  async getFlowByKey(
    tenantId: string,
    key: string
  ): Promise<ApprovalFlowWithSteps> {
    const flow = await prisma.approvalFlowDefinition.findFirst({
      where: {
        tenantId,
        key,
      },
    });

    if (!flow) {
      throw new Error(`Approval flow not found with key: ${key}`);
    }

    return this.getFlowById(flow.id, tenantId);
  }

  /**
   * List approval flows for tenant
   */
  async listFlows(
    tenantId: string,
    options?: {
      targetResource?: string;
      isActive?: boolean;
    }
  ): Promise<ApprovalFlowWithSteps[]> {
    const where: any = { tenantId };

    if (options?.targetResource) {
      where.targetResource = options.targetResource;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const flows = await prisma.approvalFlowDefinition.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(flows.map((flow) => this.getFlowById(flow.id, tenantId)));
  }

  /**
   * Update approval flow basic information
   */
  async updateFlow(
    input: UpdateApprovalFlowInput
  ): Promise<ApprovalFlowWithSteps> {
    const { flowId, tenantId, name, description, updatedBy } = input;

    try {
      // Verify flow exists and belongs to tenant
      const flow = await prisma.approvalFlowDefinition.findFirst({
        where: {
          id: flowId,
          tenantId,
        },
      });

      if (!flow) {
        throw new Error(`Approval flow not found: ${flowId}`);
      }

      // Update flow
      await prisma.approvalFlowDefinition.update({
        where: { id: flowId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_UPDATED,
        tenantId,
        updatedBy,
        flowId,
        {
          changes: { name, description },
        }
      );

      logger.info('Approval flow updated', { flowId, tenantId });

      return this.getFlowById(flowId, tenantId);
    } catch (error) {
      logger.error('Failed to update approval flow', { error, input });
      throw error;
    }
  }

  /**
   * Add a new step to approval flow
   */
  async addStep(input: AddApprovalStepInput): Promise<ApprovalFlowWithSteps> {
    const { flowId, tenantId, step, updatedBy } = input;

    try {
      // Verify flow exists
      const flow = await prisma.approvalFlowDefinition.findFirst({
        where: {
          id: flowId,
          tenantId,
        },
      });

      if (!flow) {
        throw new Error(`Approval flow not found: ${flowId}`);
      }

      // Validate step configuration
      this.validateStepConfiguration(step);

      // Create step
      await prisma.approvalStep.create({
        data: {
          flowId,
          orderIndex: step.orderIndex,
          approverType: step.approverType,
          approverRoleId: step.approverRoleId,
          approverUserId: step.approverUserId,
          dynamicRule: step.dynamicRule ? step.dynamicRule : undefined,
          minApprovals: step.minApprovals || 1,
          slaHours: step.slaHours,
        },
      });

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_UPDATED,
        tenantId,
        updatedBy,
        flowId,
        {
          action: 'add_step',
          orderIndex: step.orderIndex,
        }
      );

      logger.info('Approval step added', { flowId, orderIndex: step.orderIndex });

      return this.getFlowById(flowId, tenantId);
    } catch (error) {
      logger.error('Failed to add approval step', { error, input });
      throw error;
    }
  }

  /**
   * Update an existing approval step
   */
  async updateStep(
    input: UpdateApprovalStepInput
  ): Promise<ApprovalFlowWithSteps> {
    const {
      stepId,
      flowId,
      tenantId,
      approverType,
      approverRoleId,
      approverUserId,
      dynamicRule,
      minApprovals,
      slaHours,
      updatedBy,
    } = input;

    try {
      // Verify step exists and belongs to flow
      const step = await prisma.approvalStep.findFirst({
        where: {
          id: stepId,
          flowId,
        },
        include: {
          flow: true,
        },
      });

      if (!step || step.flow.tenantId !== tenantId) {
        throw new Error(`Approval step not found: ${stepId}`);
      }

      // Build update data
      const updateData: any = {};
      if (approverType) updateData.approverType = approverType;
      if (approverRoleId !== undefined) updateData.approverRoleId = approverRoleId;
      if (approverUserId !== undefined) updateData.approverUserId = approverUserId;
      if (dynamicRule !== undefined) updateData.dynamicRule = dynamicRule ? dynamicRule : undefined;
      if (minApprovals) updateData.minApprovals = minApprovals;
      if (slaHours !== undefined) updateData.slaHours = slaHours;

      // Update step
      await prisma.approvalStep.update({
        where: { id: stepId },
        data: updateData,
      });

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_UPDATED,
        tenantId,
        updatedBy,
        flowId,
        {
          action: 'update_step',
          stepId,
        }
      );

      logger.info('Approval step updated', { stepId, flowId });

      return this.getFlowById(flowId, tenantId);
    } catch (error) {
      logger.error('Failed to update approval step', { error, input });
      throw error;
    }
  }

  /**
   * Remove a step from approval flow
   */
  async removeStep(
    stepId: string,
    flowId: string,
    tenantId: string,
    removedBy: string
  ): Promise<ApprovalFlowWithSteps> {
    try {
      // Verify step exists and belongs to flow
      const step = await prisma.approvalStep.findFirst({
        where: {
          id: stepId,
          flowId,
        },
        include: {
          flow: true,
        },
      });

      if (!step || step.flow.tenantId !== tenantId) {
        throw new Error(`Approval step not found: ${stepId}`);
      }

      // Delete step
      await prisma.approvalStep.delete({
        where: { id: stepId },
      });

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_UPDATED,
        tenantId,
        removedBy,
        flowId,
        {
          action: 'remove_step',
          stepId,
        }
      );

      logger.info('Approval step removed', { stepId, flowId });

      return this.getFlowById(flowId, tenantId);
    } catch (error) {
      logger.error('Failed to remove approval step', { error, stepId, flowId });
      throw error;
    }
  }

  /**
   * Reorder approval steps
   */
  async reorderSteps(
    input: ReorderStepsInput
  ): Promise<ApprovalFlowWithSteps> {
    const { flowId, tenantId, stepOrdering, updatedBy } = input;

    try {
      // Verify flow exists
      const flow = await prisma.approvalFlowDefinition.findFirst({
        where: {
          id: flowId,
          tenantId,
        },
      });

      if (!flow) {
        throw new Error(`Approval flow not found: ${flowId}`);
      }

      // Update step order in transaction
      await prisma.$transaction(
        stepOrdering.map((item) =>
          prisma.approvalStep.update({
            where: { id: item.stepId },
            data: { orderIndex: item.orderIndex },
          })
        )
      );

      // Log audit event
      await this.auditService.logApprovalFlowEvent(
        AuditEventTypes.APPROVAL_FLOW_UPDATED,
        tenantId,
        updatedBy,
        flowId,
        {
          action: 'reorder_steps',
        }
      );

      logger.info('Approval steps reordered', { flowId });

      return this.getFlowById(flowId, tenantId);
    } catch (error) {
      logger.error('Failed to reorder approval steps', { error, input });
      throw error;
    }
  }

  /**
   * Activate approval flow
   */
  async activateFlow(
    flowId: string,
    tenantId: string,
    activatedBy: string
  ): Promise<ApprovalFlowWithSteps> {
    await prisma.approvalFlowDefinition.update({
      where: { id: flowId },
      data: { isActive: true },
    });

    await this.auditService.logApprovalFlowEvent(
      AuditEventTypes.APPROVAL_FLOW_ACTIVATED,
      tenantId,
      activatedBy,
      flowId,
      {}
    );

    logger.info('Approval flow activated', { flowId });

    return this.getFlowById(flowId, tenantId);
  }

  /**
   * Deactivate approval flow
   */
  async deactivateFlow(
    flowId: string,
    tenantId: string,
    deactivatedBy: string
  ): Promise<ApprovalFlowWithSteps> {
    await prisma.approvalFlowDefinition.update({
      where: { id: flowId },
      data: { isActive: false },
    });

    await this.auditService.logApprovalFlowEvent(
      AuditEventTypes.APPROVAL_FLOW_DEACTIVATED,
      tenantId,
      deactivatedBy,
      flowId,
      {}
    );

    logger.info('Approval flow deactivated', { flowId });

    return this.getFlowById(flowId, tenantId);
  }

  /**
   * Publish new version of approval flow
   */
  async publishNewVersion(
    flowId: string,
    tenantId: string,
    publishedBy: string
  ): Promise<ApprovalFlowWithSteps> {
    const flow = await prisma.approvalFlowDefinition.findFirst({
      where: { id: flowId, tenantId },
    });

    if (!flow) {
      throw new Error(`Approval flow not found: ${flowId}`);
    }

    await prisma.approvalFlowDefinition.update({
      where: { id: flowId },
      data: { version: flow.version + 1 },
    });

    await this.auditService.logApprovalFlowEvent(
      AuditEventTypes.APPROVAL_FLOW_VERSION_PUBLISHED,
      tenantId,
      publishedBy,
      flowId,
      {
        oldVersion: flow.version,
        newVersion: flow.version + 1,
      }
    );

    logger.info('Approval flow version published', {
      flowId,
      version: flow.version + 1,
    });

    return this.getFlowById(flowId, tenantId);
  }

  /**
   * Delete approval flow
   */
  async deleteFlow(
    flowId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    try {
      const flow = await prisma.approvalFlowDefinition.findFirst({
        where: { id: flowId, tenantId },
        include: {
          instances: true,
        },
      });

      if (!flow) {
        throw new Error(`Approval flow not found: ${flowId}`);
      }

      // Check if flow has active instances
      const activeInstances = flow.instances.filter(
        (i) => i.status === 'PENDING'
      );

      if (activeInstances.length > 0) {
        throw new Error(
          `Cannot delete flow with ${activeInstances.length} active approval instances`
        );
      }

      // Log audit event before deletion
      await this.auditService.logApprovalFlowEvent(
        'approval_flow.deleted',
        tenantId,
        deletedBy,
        flowId,
        {
          name: flow.name,
          key: flow.key,
        }
      );

      // Delete flow (cascades to steps)
      await prisma.approvalFlowDefinition.delete({
        where: { id: flowId },
      });

      logger.info('Approval flow deleted', { flowId });
    } catch (error) {
      logger.error('Failed to delete approval flow', { error, flowId });
      throw error;
    }
  }

  /**
   * Validate step configuration
   */
  private validateStepConfiguration(step: CreateApprovalStepInput): void {
    switch (step.approverType) {
      case 'ROLE':
        if (!step.approverRoleId) {
          throw new Error('approverRoleId is required for ROLE approver type');
        }
        break;
      case 'USER':
        if (!step.approverUserId) {
          throw new Error('approverUserId is required for USER approver type');
        }
        break;
      case 'DYNAMIC':
        if (!step.dynamicRule || !step.dynamicRule.type) {
          throw new Error(
            'dynamicRule with type is required for DYNAMIC approver type'
          );
        }
        break;
      default:
        throw new Error(`Invalid approver type: ${step.approverType}`);
    }
  }
}

export default ApprovalFlowService;
