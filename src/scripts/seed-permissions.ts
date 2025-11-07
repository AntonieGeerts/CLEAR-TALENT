/**
 * Seed RBAC Permissions
 *
 * Creates all necessary permissions for the RBAC system and assigns them to system default roles.
 * Run this script after the access control migration to populate permissions.
 */

import { config } from 'dotenv';
config(); // Load environment variables

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define all permissions for the system
const PERMISSIONS = [
  // Role Management
  { resource: 'role', action: 'create', scope: 'ORG', description: 'Create custom roles' },
  { resource: 'role', action: 'read', scope: 'ORG', description: 'View roles' },
  { resource: 'role', action: 'update', scope: 'ORG', description: 'Update role details' },
  { resource: 'role', action: 'delete', scope: 'ORG', description: 'Delete custom roles' },
  { resource: 'role', action: 'assign_permissions', scope: 'ORG', description: 'Assign permissions to roles' },

  // Permission Management
  { resource: 'permission', action: 'read', scope: 'ORG', description: 'View permissions' },

  // Staff Management
  { resource: 'staff', action: 'invite', scope: 'ORG', description: 'Invite staff members' },
  { resource: 'staff', action: 'read', scope: 'ORG', description: 'View staff members' },
  { resource: 'staff', action: 'update', scope: 'ORG', description: 'Update staff membership' },
  { resource: 'staff', action: 'remove', scope: 'ORG', description: 'Remove staff members' },

  // Audit Logs
  { resource: 'audit', action: 'read', scope: 'ORG', description: 'View audit logs' },
  { resource: 'audit', action: 'export', scope: 'ORG', description: 'Export audit logs' },

  // Competency Management
  { resource: 'competency', action: 'create', scope: 'ORG', description: 'Create competencies' },
  { resource: 'competency', action: 'read', scope: 'ORG', description: 'View competencies' },
  { resource: 'competency', action: 'read', scope: 'TEAM', description: 'View team competencies' },
  { resource: 'competency', action: 'read', scope: 'SELF', description: 'View own competencies' },
  { resource: 'competency', action: 'update', scope: 'ORG', description: 'Update competencies' },
  { resource: 'competency', action: 'delete', scope: 'ORG', description: 'Delete competencies' },

  // Role Profile Management
  { resource: 'role_profile', action: 'create', scope: 'ORG', description: 'Create role profiles' },
  { resource: 'role_profile', action: 'read', scope: 'ORG', description: 'View role profiles' },
  { resource: 'role_profile', action: 'read', scope: 'TEAM', description: 'View team role profiles' },
  { resource: 'role_profile', action: 'read', scope: 'SELF', description: 'View own role profile' },
  { resource: 'role_profile', action: 'update', scope: 'ORG', description: 'Update role profiles' },
  { resource: 'role_profile', action: 'delete', scope: 'ORG', description: 'Delete role profiles' },

  // Goal Management
  { resource: 'goal', action: 'create', scope: 'ORG', description: 'Create organization goals' },
  { resource: 'goal', action: 'create', scope: 'TEAM', description: 'Create team goals' },
  { resource: 'goal', action: 'create', scope: 'SELF', description: 'Create personal goals' },
  { resource: 'goal', action: 'read', scope: 'ORG', description: 'View all goals' },
  { resource: 'goal', action: 'read', scope: 'TEAM', description: 'View team goals' },
  { resource: 'goal', action: 'read', scope: 'SELF', description: 'View own goals' },
  { resource: 'goal', action: 'update', scope: 'ORG', description: 'Update organization goals' },
  { resource: 'goal', action: 'update', scope: 'TEAM', description: 'Update team goals' },
  { resource: 'goal', action: 'update', scope: 'SELF', description: 'Update own goals' },
  { resource: 'goal', action: 'delete', scope: 'ORG', description: 'Delete organization goals' },

  // Review Management
  { resource: 'review', action: 'create', scope: 'TEAM', description: 'Create team reviews' },
  { resource: 'review', action: 'read', scope: 'ORG', description: 'View all reviews' },
  { resource: 'review', action: 'read', scope: 'TEAM', description: 'View team reviews' },
  { resource: 'review', action: 'read', scope: 'SELF', description: 'View own reviews' },
  { resource: 'review', action: 'update', scope: 'TEAM', description: 'Update team reviews' },
  { resource: 'review', action: 'update', scope: 'SELF', description: 'Update own reviews' },

  // Assessment Management
  { resource: 'assessment', action: 'create', scope: 'SELF', description: 'Create self assessments' },
  { resource: 'assessment', action: 'read', scope: 'ORG', description: 'View all assessments' },
  { resource: 'assessment', action: 'read', scope: 'TEAM', description: 'View team assessments' },
  { resource: 'assessment', action: 'read', scope: 'SELF', description: 'View own assessments' },

  // Workflow Management
  { resource: 'workflow', action: 'read', scope: 'ORG', description: 'View workflows' },
  { resource: 'workflow', action: 'read', scope: 'SELF', description: 'View own workflows' },
];

// Define role permission mappings
const ROLE_PERMISSIONS = {
  ADMIN: [
    // Full access to all resources at ORG level
    'role:create:ORG',
    'role:read:ORG',
    'role:update:ORG',
    'role:delete:ORG',
    'role:assign_permissions:ORG',
    'permission:read:ORG',
    'staff:invite:ORG',
    'staff:read:ORG',
    'staff:update:ORG',
    'staff:remove:ORG',
    'audit:read:ORG',
    'audit:export:ORG',
    'competency:create:ORG',
    'competency:read:ORG',
    'competency:update:ORG',
    'competency:delete:ORG',
    'role_profile:create:ORG',
    'role_profile:read:ORG',
    'role_profile:update:ORG',
    'role_profile:delete:ORG',
    'goal:create:ORG',
    'goal:read:ORG',
    'goal:update:ORG',
    'goal:delete:ORG',
    'review:read:ORG',
    'assessment:read:ORG',
    'workflow:read:ORG',
  ],
  DEPARTMENT_HEAD: [
    // Team-level permissions
    'competency:read:ORG',
    'competency:read:TEAM',
    'role_profile:read:ORG',
    'role_profile:read:TEAM',
    'goal:create:TEAM',
    'goal:read:ORG',
    'goal:read:TEAM',
    'goal:update:TEAM',
    'review:create:TEAM',
    'review:read:TEAM',
    'review:update:TEAM',
    'assessment:read:TEAM',
    'workflow:read:ORG',
  ],
  MANAGER: [
    // Team-level permissions for managers
    'competency:read:TEAM',
    'role_profile:read:TEAM',
    'goal:create:TEAM',
    'goal:read:TEAM',
    'goal:update:TEAM',
    'review:create:TEAM',
    'review:read:TEAM',
    'review:update:TEAM',
    'assessment:read:TEAM',
  ],
  EMPLOYEE: [
    // Self-service permissions
    'competency:read:SELF',
    'role_profile:read:SELF',
    'goal:create:SELF',
    'goal:read:SELF',
    'goal:update:SELF',
    'review:read:SELF',
    'review:update:SELF',
    'assessment:create:SELF',
    'assessment:read:SELF',
    'workflow:read:SELF',
  ],
  REVIEWER: [
    // Review-focused permissions
    'competency:read:TEAM',
    'role_profile:read:TEAM',
    'goal:read:TEAM',
    'review:create:TEAM',
    'review:read:TEAM',
    'review:update:TEAM',
    'assessment:read:TEAM',
  ],
};

async function main() {
  console.log('🔐 Starting RBAC permissions seed...\n');

  // Create permissions
  console.log('📝 Creating permissions...');
  const permissionMap = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
        },
      },
      update: {
        description: perm.description,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        description: perm.description,
      },
    });

    const key = `${perm.resource}:${perm.action}:${perm.scope}`;
    permissionMap.set(key, permission.id);
    console.log(`  ✓ ${key}`);
  }

  console.log(`\n✅ Created ${permissionMap.size} permissions\n`);

  // Assign permissions to system default roles
  console.log('🔗 Assigning permissions to roles...');

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    // Find the role
    const role = await prisma.role.findFirst({
      where: {
        key: roleKey,
        tenantId: null, // System default role
      },
    });

    if (!role) {
      console.log(`  ⚠️  Role ${roleKey} not found, skipping...`);
      continue;
    }

    // Get permission IDs
    const permissionIds = permissionKeys
      .map((key) => permissionMap.get(key))
      .filter((id): id is string => id !== undefined);

    if (permissionIds.length === 0) {
      console.log(`  ⚠️  No permissions found for ${roleKey}`);
      continue;
    }

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create new role permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });

    console.log(`  ✓ ${roleKey}: ${permissionIds.length} permissions assigned`);
  }

  console.log('\n✅ Permission seeding completed successfully!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
