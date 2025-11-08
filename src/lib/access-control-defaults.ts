import { PermissionScope, UserRole } from '@prisma/client';

export type SystemRoleKey =
  | 'TENANT_OWNER'
  | 'HR_ADMIN'
  | 'LINE_MANAGER'
  | 'EMPLOYEE'
  | 'READ_ONLY';

const { ORG, TEAM, SELF } = PermissionScope;

export interface PermissionDefinition {
  key: string;
  resource: string;
  action: string;
  description: string;
}

export interface SystemRoleDefinition {
  name: string;
  description: string;
  isSystemDefault: boolean;
  isEditable: boolean;
}

export interface RolePermissionDefinition {
  permissionKey: string;
  scope: PermissionScope;
}

export const PERMISSIONS: PermissionDefinition[] = [
  { key: 'staff.view', resource: 'staff', action: 'view', description: 'View staff members' },
  { key: 'staff.manage', resource: 'staff', action: 'manage', description: 'Create, update, and manage staff members' },
  { key: 'staff.invite', resource: 'staff', action: 'invite', description: 'Invite new staff members' },
  { key: 'staff.deactivate', resource: 'staff', action: 'deactivate', description: 'Deactivate staff members' },
  { key: 'roles.view', resource: 'roles', action: 'view', description: 'View roles and permissions' },
  { key: 'roles.manage', resource: 'roles', action: 'manage', description: 'Create and edit custom roles' },
  { key: 'roles.assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
  { key: 'approvals.view', resource: 'approvals', action: 'view', description: 'View approval flows' },
  { key: 'approvals.configure', resource: 'approvals', action: 'configure', description: 'Configure approval flow definitions' },
  { key: 'approvals.approve', resource: 'approvals', action: 'approve', description: 'Approve requests in approval flows' },
  { key: 'performance_reviews.view', resource: 'performance_reviews', action: 'view', description: 'View performance reviews' },
  { key: 'performance_reviews.manage', resource: 'performance_reviews', action: 'manage', description: 'Create and manage performance reviews' },
  { key: 'performance_reviews.conduct', resource: 'performance_reviews', action: 'conduct', description: 'Conduct reviews for direct reports' },
  { key: 'goals.view', resource: 'goals', action: 'view', description: 'View goals and OKRs' },
  { key: 'goals.manage', resource: 'goals', action: 'manage', description: 'Create and manage goals' },
  { key: 'goals.approve', resource: 'goals', action: 'approve', description: 'Approve goal changes' },
  { key: 'competencies.view', resource: 'competencies', action: 'view', description: 'View competency library' },
  { key: 'competencies.manage', resource: 'competencies', action: 'manage', description: 'Manage competency definitions' },
  { key: 'development_plans.view', resource: 'development_plans', action: 'view', description: 'View development plans' },
  { key: 'development_plans.manage', resource: 'development_plans', action: 'manage', description: 'Create and manage development plans' },
  { key: 'feedback.view', resource: 'feedback', action: 'view', description: 'View feedback items' },
  { key: 'feedback.give', resource: 'feedback', action: 'give', description: 'Give feedback to others' },
  { key: 'reports.view', resource: 'reports', action: 'view', description: 'View reports and analytics' },
  { key: 'reports.export', resource: 'reports', action: 'export', description: 'Export reports and data' },
  { key: 'audit_logs.view', resource: 'audit_logs', action: 'view', description: 'View audit logs' },
];

export const SYSTEM_ROLE_DEFINITIONS: Record<SystemRoleKey, SystemRoleDefinition> = {
  TENANT_OWNER: {
    name: 'Organization Owner',
    description: 'Full access to all organizational resources and settings',
    isSystemDefault: true,
    isEditable: false,
  },
  HR_ADMIN: {
    name: 'HR Administrator',
    description: 'Manage staff, roles, approvals, and HR modules',
    isSystemDefault: true,
    isEditable: false,
  },
  LINE_MANAGER: {
    name: 'Line Manager',
    description: 'Manage teams, reviews, goals, and approvals for direct reports',
    isSystemDefault: true,
    isEditable: false,
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Employee self-service access',
    isSystemDefault: true,
    isEditable: false,
  },
  READ_ONLY: {
    name: 'Read Only',
    description: 'View-only access to authorized resources',
    isSystemDefault: true,
    isEditable: false,
  },
};

export const ROLE_PERMISSIONS: Record<SystemRoleKey, RolePermissionDefinition[]> = {
  TENANT_OWNER: [
    { permissionKey: 'staff.view', scope: ORG },
    { permissionKey: 'staff.manage', scope: ORG },
    { permissionKey: 'staff.invite', scope: ORG },
    { permissionKey: 'staff.deactivate', scope: ORG },
    { permissionKey: 'roles.view', scope: ORG },
    { permissionKey: 'roles.manage', scope: ORG },
    { permissionKey: 'roles.assign', scope: ORG },
    { permissionKey: 'approvals.view', scope: ORG },
    { permissionKey: 'approvals.configure', scope: ORG },
    { permissionKey: 'approvals.approve', scope: ORG },
    { permissionKey: 'performance_reviews.view', scope: ORG },
    { permissionKey: 'performance_reviews.manage', scope: ORG },
    { permissionKey: 'performance_reviews.conduct', scope: ORG },
    { permissionKey: 'goals.view', scope: ORG },
    { permissionKey: 'goals.manage', scope: ORG },
    { permissionKey: 'goals.approve', scope: ORG },
    { permissionKey: 'competencies.view', scope: ORG },
    { permissionKey: 'competencies.manage', scope: ORG },
    { permissionKey: 'development_plans.view', scope: ORG },
    { permissionKey: 'development_plans.manage', scope: ORG },
    { permissionKey: 'feedback.view', scope: ORG },
    { permissionKey: 'feedback.give', scope: ORG },
    { permissionKey: 'reports.view', scope: ORG },
    { permissionKey: 'reports.export', scope: ORG },
    { permissionKey: 'audit_logs.view', scope: ORG },
  ],
  HR_ADMIN: [
    { permissionKey: 'staff.view', scope: ORG },
    { permissionKey: 'staff.manage', scope: ORG },
    { permissionKey: 'staff.invite', scope: ORG },
    { permissionKey: 'roles.view', scope: ORG },
    { permissionKey: 'roles.manage', scope: ORG },
    { permissionKey: 'roles.assign', scope: ORG },
    { permissionKey: 'approvals.view', scope: ORG },
    { permissionKey: 'approvals.configure', scope: ORG },
    { permissionKey: 'performance_reviews.view', scope: ORG },
    { permissionKey: 'performance_reviews.manage', scope: ORG },
    { permissionKey: 'goals.view', scope: ORG },
    { permissionKey: 'goals.manage', scope: ORG },
    { permissionKey: 'competencies.view', scope: ORG },
    { permissionKey: 'competencies.manage', scope: ORG },
    { permissionKey: 'development_plans.view', scope: ORG },
    { permissionKey: 'development_plans.manage', scope: ORG },
    { permissionKey: 'feedback.view', scope: ORG },
    { permissionKey: 'reports.view', scope: ORG },
    { permissionKey: 'reports.export', scope: ORG },
  ],
  LINE_MANAGER: [
    { permissionKey: 'staff.view', scope: TEAM },
    { permissionKey: 'performance_reviews.view', scope: TEAM },
    { permissionKey: 'performance_reviews.conduct', scope: TEAM },
    { permissionKey: 'goals.view', scope: TEAM },
    { permissionKey: 'goals.manage', scope: TEAM },
    { permissionKey: 'goals.approve', scope: TEAM },
    { permissionKey: 'development_plans.view', scope: TEAM },
    { permissionKey: 'development_plans.manage', scope: TEAM },
    { permissionKey: 'feedback.view', scope: TEAM },
    { permissionKey: 'feedback.give', scope: TEAM },
    { permissionKey: 'approvals.approve', scope: TEAM },
    { permissionKey: 'competencies.view', scope: ORG },
    { permissionKey: 'reports.view', scope: TEAM },
  ],
  EMPLOYEE: [
    { permissionKey: 'performance_reviews.view', scope: SELF },
    { permissionKey: 'goals.view', scope: SELF },
    { permissionKey: 'goals.manage', scope: SELF },
    { permissionKey: 'development_plans.view', scope: SELF },
    { permissionKey: 'feedback.view', scope: SELF },
    { permissionKey: 'feedback.give', scope: ORG },
    { permissionKey: 'competencies.view', scope: ORG },
  ],
  READ_ONLY: [
    { permissionKey: 'staff.view', scope: ORG },
    { permissionKey: 'performance_reviews.view', scope: ORG },
    { permissionKey: 'goals.view', scope: ORG },
    { permissionKey: 'competencies.view', scope: ORG },
    { permissionKey: 'reports.view', scope: ORG },
  ],
};

export const LEGACY_ROLE_TO_SYSTEM_ROLE: Record<string, SystemRoleKey> = {
  ADMIN: 'TENANT_OWNER',
  HR_MANAGER: 'HR_ADMIN',
  DEPARTMENT_HEAD: 'LINE_MANAGER',
  MANAGER: 'LINE_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  REVIEWER: 'READ_ONLY',
  SYSTEM_ADMIN: 'TENANT_OWNER',
};

export function mapLegacyRoleToSystemRole(role?: UserRole | string | null): SystemRoleKey {
  if (!role) {
    return 'EMPLOYEE';
  }
  return LEGACY_ROLE_TO_SYSTEM_ROLE[role] ?? 'EMPLOYEE';
}
