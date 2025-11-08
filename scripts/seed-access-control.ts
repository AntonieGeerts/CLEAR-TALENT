/**
 * Seed Script for Access Control System
 *
 * Seeds:
 * - System default roles (TENANT_OWNER, HR_ADMIN, LINE_MANAGER, EMPLOYEE, READ_ONLY)
 * - Standard permissions (staff, roles, approvals, performance_reviews, goals, competencies)
 * - Role-permission mappings for each system role
 *
 * Usage:
 *   npm run seed:access-control
 *
 * Or with Prisma:
 *   npx ts-node scripts/seed-access-control.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// System role definitions
const SYSTEM_ROLES = [
  {
    key: 'TENANT_OWNER',
    name: 'Organization Owner',
    description: 'Full access to all organizational resources and settings',
    isSystemDefault: true,
    isEditable: false,
  },
  {
    key: 'HR_ADMIN',
    name: 'HR Administrator',
    description: 'Manage staff, roles, approval flows, and HR modules',
    isSystemDefault: true,
    isEditable: false,
  },
  {
    key: 'LINE_MANAGER',
    name: 'Line Manager',
    description: 'Manage direct reports, reviews, goals, and development plans',
    isSystemDefault: true,
    isEditable: false,
  },
  {
    key: 'EMPLOYEE',
    name: 'Employee',
    description: 'Standard employee access with self-service capabilities',
    isSystemDefault: true,
    isEditable: false,
  },
  {
    key: 'READ_ONLY',
    name: 'Read Only',
    description: 'View-only access to authorized resources',
    isSystemDefault: true,
    isEditable: false,
  },
];

// Permission definitions
const PERMISSIONS = [
  // Staff Management
  { key: 'staff.view', resource: 'staff', action: 'view', description: 'View staff members' },
  { key: 'staff.manage', resource: 'staff', action: 'manage', description: 'Create, update, and manage staff members' },
  { key: 'staff.invite', resource: 'staff', action: 'invite', description: 'Invite new staff members' },
  { key: 'staff.deactivate', resource: 'staff', action: 'deactivate', description: 'Deactivate staff members' },

  // Role & Permission Management
  { key: 'roles.view', resource: 'roles', action: 'view', description: 'View roles and permissions' },
  { key: 'roles.manage', resource: 'roles', action: 'manage', description: 'Create and edit custom roles' },
  { key: 'roles.assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },

  // Approval Flows
  { key: 'approvals.view', resource: 'approvals', action: 'view', description: 'View approval flows' },
  { key: 'approvals.configure', resource: 'approvals', action: 'configure', description: 'Configure approval flow definitions' },
  { key: 'approvals.approve', resource: 'approvals', action: 'approve', description: 'Approve requests in approval flows' },

  // Performance Reviews
  { key: 'performance_reviews.view', resource: 'performance_reviews', action: 'view', description: 'View performance reviews' },
  { key: 'performance_reviews.manage', resource: 'performance_reviews', action: 'manage', description: 'Create and manage performance reviews' },
  { key: 'performance_reviews.conduct', resource: 'performance_reviews', action: 'conduct', description: 'Conduct reviews for direct reports' },

  // Goals & OKRs
  { key: 'goals.view', resource: 'goals', action: 'view', description: 'View goals and OKRs' },
  { key: 'goals.manage', resource: 'goals', action: 'manage', description: 'Create and manage goals' },
  { key: 'goals.approve', resource: 'goals', action: 'approve', description: 'Approve goal changes' },

  // Competencies
  { key: 'competencies.view', resource: 'competencies', action: 'view', description: 'View competency library' },
  { key: 'competencies.manage', resource: 'competencies', action: 'manage', description: 'Manage competency definitions' },

  // Development Plans
  { key: 'development_plans.view', resource: 'development_plans', action: 'view', description: 'View development plans' },
  { key: 'development_plans.manage', resource: 'development_plans', action: 'manage', description: 'Create and manage development plans' },

  // Feedback
  { key: 'feedback.view', resource: 'feedback', action: 'view', description: 'View feedback items' },
  { key: 'feedback.give', resource: 'feedback', action: 'give', description: 'Give feedback to others' },

  // Reports & Analytics
  { key: 'reports.view', resource: 'reports', action: 'view', description: 'View reports and analytics' },
  { key: 'reports.export', resource: 'reports', action: 'export', description: 'Export reports and data' },

  // Audit Logs
  { key: 'audit_logs.view', resource: 'audit_logs', action: 'view', description: 'View audit logs' },
];

// Role-Permission mappings with scopes
const ROLE_PERMISSIONS = {
  TENANT_OWNER: [
    // Full access to everything
    { permissionKey: 'staff.view', scope: 'ORG' },
    { permissionKey: 'staff.manage', scope: 'ORG' },
    { permissionKey: 'staff.invite', scope: 'ORG' },
    { permissionKey: 'staff.deactivate', scope: 'ORG' },
    { permissionKey: 'roles.view', scope: 'ORG' },
    { permissionKey: 'roles.manage', scope: 'ORG' },
    { permissionKey: 'roles.assign', scope: 'ORG' },
    { permissionKey: 'approvals.view', scope: 'ORG' },
    { permissionKey: 'approvals.configure', scope: 'ORG' },
    { permissionKey: 'approvals.approve', scope: 'ORG' },
    { permissionKey: 'performance_reviews.view', scope: 'ORG' },
    { permissionKey: 'performance_reviews.manage', scope: 'ORG' },
    { permissionKey: 'performance_reviews.conduct', scope: 'ORG' },
    { permissionKey: 'goals.view', scope: 'ORG' },
    { permissionKey: 'goals.manage', scope: 'ORG' },
    { permissionKey: 'goals.approve', scope: 'ORG' },
    { permissionKey: 'competencies.view', scope: 'ORG' },
    { permissionKey: 'competencies.manage', scope: 'ORG' },
    { permissionKey: 'development_plans.view', scope: 'ORG' },
    { permissionKey: 'development_plans.manage', scope: 'ORG' },
    { permissionKey: 'feedback.view', scope: 'ORG' },
    { permissionKey: 'feedback.give', scope: 'ORG' },
    { permissionKey: 'reports.view', scope: 'ORG' },
    { permissionKey: 'reports.export', scope: 'ORG' },
    { permissionKey: 'audit_logs.view', scope: 'ORG' },
  ],
  HR_ADMIN: [
    // Staff and organizational management
    { permissionKey: 'staff.view', scope: 'ORG' },
    { permissionKey: 'staff.manage', scope: 'ORG' },
    { permissionKey: 'staff.invite', scope: 'ORG' },
    { permissionKey: 'roles.view', scope: 'ORG' },
    { permissionKey: 'roles.manage', scope: 'ORG' },
    { permissionKey: 'roles.assign', scope: 'ORG' },
    { permissionKey: 'approvals.view', scope: 'ORG' },
    { permissionKey: 'approvals.configure', scope: 'ORG' },
    { permissionKey: 'performance_reviews.view', scope: 'ORG' },
    { permissionKey: 'performance_reviews.manage', scope: 'ORG' },
    { permissionKey: 'goals.view', scope: 'ORG' },
    { permissionKey: 'goals.manage', scope: 'ORG' },
    { permissionKey: 'competencies.view', scope: 'ORG' },
    { permissionKey: 'competencies.manage', scope: 'ORG' },
    { permissionKey: 'development_plans.view', scope: 'ORG' },
    { permissionKey: 'development_plans.manage', scope: 'ORG' },
    { permissionKey: 'feedback.view', scope: 'ORG' },
    { permissionKey: 'reports.view', scope: 'ORG' },
    { permissionKey: 'reports.export', scope: 'ORG' },
  ],
  LINE_MANAGER: [
    // Team management capabilities
    { permissionKey: 'staff.view', scope: 'TEAM' },
    { permissionKey: 'performance_reviews.view', scope: 'TEAM' },
    { permissionKey: 'performance_reviews.conduct', scope: 'TEAM' },
    { permissionKey: 'goals.view', scope: 'TEAM' },
    { permissionKey: 'goals.manage', scope: 'TEAM' },
    { permissionKey: 'goals.approve', scope: 'TEAM' },
    { permissionKey: 'development_plans.view', scope: 'TEAM' },
    { permissionKey: 'development_plans.manage', scope: 'TEAM' },
    { permissionKey: 'feedback.view', scope: 'TEAM' },
    { permissionKey: 'feedback.give', scope: 'TEAM' },
    { permissionKey: 'approvals.approve', scope: 'TEAM' },
    { permissionKey: 'competencies.view', scope: 'ORG' },
    { permissionKey: 'reports.view', scope: 'TEAM' },
  ],
  EMPLOYEE: [
    // Self-service capabilities
    { permissionKey: 'performance_reviews.view', scope: 'SELF' },
    { permissionKey: 'goals.view', scope: 'SELF' },
    { permissionKey: 'goals.manage', scope: 'SELF' },
    { permissionKey: 'development_plans.view', scope: 'SELF' },
    { permissionKey: 'feedback.view', scope: 'SELF' },
    { permissionKey: 'feedback.give', scope: 'ORG' },
    { permissionKey: 'competencies.view', scope: 'ORG' },
  ],
  READ_ONLY: [
    // View-only access
    { permissionKey: 'staff.view', scope: 'ORG' },
    { permissionKey: 'performance_reviews.view', scope: 'ORG' },
    { permissionKey: 'goals.view', scope: 'ORG' },
    { permissionKey: 'competencies.view', scope: 'ORG' },
    { permissionKey: 'reports.view', scope: 'ORG' },
  ],
};

async function main() {
  console.log('🚀 Starting access control seed...\n');

  try {
    // 1. Seed Permissions (global, no tenant)
    console.log('📝 Seeding permissions...');
    for (const perm of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: perm.key },
        update: {},
        create: perm,
      });
    }
    console.log(`✅ Created ${PERMISSIONS.length} permissions\n`);

    // 2. Seed System Roles (no tenant - system-wide)
    console.log('🎭 Seeding system roles...');
    for (const roleData of SYSTEM_ROLES) {
      // Use findFirst + create/update pattern for null tenantId (upsert doesn't work with null in composite unique)
      const existingRole = await prisma.role.findFirst({
        where: {
          key: roleData.key,
          tenantId: null,
        },
      });

      if (existingRole) {
        // Role already exists, skip
        console.log(`  ⏭️  ${roleData.name} already exists, skipping`);
      } else {
        // Create new system role
        await prisma.role.create({
          data: {
            ...roleData,
            tenantId: null, // System roles have no tenant
          },
        });
        console.log(`  ✅ Created ${roleData.name}`);
      }
    }
    console.log(`✅ Completed system roles seeding\n`);

    // 3. Seed Role-Permission Mappings (system-wide)
    console.log('🔗 Seeding role-permission mappings...');
    let mappingCount = 0;

    for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.findFirst({
        where: {
          key: roleKey,
          tenantId: null,
        },
      });

      if (!role) {
        console.warn(`⚠️  Role ${roleKey} not found, skipping permissions`);
        continue;
      }

      for (const permMapping of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { key: permMapping.permissionKey },
        });

        if (!permission) {
          console.warn(`⚠️  Permission ${permMapping.permissionKey} not found`);
          continue;
        }

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {
            scope: permMapping.scope,
          },
          create: {
            tenantId: null, // System role permissions are tenant-agnostic
            roleId: role.id,
            permissionId: permission.id,
            scope: permMapping.scope,
          },
        });

        mappingCount++;
      }
    }

    console.log(`✅ Created ${mappingCount} role-permission mappings\n`);

    console.log('✨ Access control seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Permissions: ${PERMISSIONS.length}`);
    console.log(`   - System Roles: ${SYSTEM_ROLES.length}`);
    console.log(`   - Role-Permission Mappings: ${mappingCount}`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Run migrations: npm run prisma:migrate:deploy');
    console.log('   2. Create your first tenant');
    console.log('   3. Assign system roles to tenant members\n');

  } catch (error) {
    console.error('❌ Error seeding access control:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
