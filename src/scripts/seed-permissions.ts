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
  { key: 'role.create', resource: 'role', action: 'create', description: 'Create custom roles' },
  { key: 'role.read', resource: 'role', action: 'read', description: 'View roles' },
  { key: 'role.update', resource: 'role', action: 'update', description: 'Update role details' },
  { key: 'role.delete', resource: 'role', action: 'delete', description: 'Delete custom roles' },
  { key: 'role.assign_permissions', resource: 'role', action: 'assign_permissions', description: 'Assign permissions to roles' },

  // Permission Management
  { key: 'permission.read', resource: 'permission', action: 'read', description: 'View permissions' },

  // Staff Management
  { key: 'staff.invite', resource: 'staff', action: 'invite', description: 'Invite staff members' },
  { key: 'staff.read', resource: 'staff', action: 'read', description: 'View staff members' },
  { key: 'staff.update', resource: 'staff', action: 'update', description: 'Update staff membership' },
  { key: 'staff.remove', resource: 'staff', action: 'remove', description: 'Remove staff members' },

  // Audit Logs
  { key: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },
  { key: 'audit.export', resource: 'audit', action: 'export', description: 'Export audit logs' },

  // Competency Management
  { key: 'competency.create', resource: 'competency', action: 'create', description: 'Create competencies' },
  { key: 'competency.read', resource: 'competency', action: 'read', description: 'View competencies' },
  { key: 'competency.update', resource: 'competency', action: 'update', description: 'Update competencies' },
  { key: 'competency.delete', resource: 'competency', action: 'delete', description: 'Delete competencies' },

  // Role Profile Management
  { key: 'role_profile.create', resource: 'role_profile', action: 'create', description: 'Create role profiles' },
  { key: 'role_profile.read', resource: 'role_profile', action: 'read', description: 'View role profiles' },
  { key: 'role_profile.update', resource: 'role_profile', action: 'update', description: 'Update role profiles' },
  { key: 'role_profile.delete', resource: 'role_profile', action: 'delete', description: 'Delete role profiles' },

  // Goal Management
  { key: 'goal.create', resource: 'goal', action: 'create', description: 'Create goals' },
  { key: 'goal.read', resource: 'goal', action: 'read', description: 'View goals' },
  { key: 'goal.update', resource: 'goal', action: 'update', description: 'Update goals' },
  { key: 'goal.delete', resource: 'goal', action: 'delete', description: 'Delete goals' },

  // Review Management
  { key: 'review.create', resource: 'review', action: 'create', description: 'Create reviews' },
  { key: 'review.read', resource: 'review', action: 'read', description: 'View reviews' },
  { key: 'review.update', resource: 'review', action: 'update', description: 'Update reviews' },
  { key: 'review.delete', resource: 'review', action: 'delete', description: 'Delete reviews' },

  // Assessment Management
  { key: 'assessment.create', resource: 'assessment', action: 'create', description: 'Create assessments' },
  { key: 'assessment.read', resource: 'assessment', action: 'read', description: 'View assessments' },
  { key: 'assessment.update', resource: 'assessment', action: 'update', description: 'Update assessments' },

  // Workflow Management
  { key: 'workflow.read', resource: 'workflow', action: 'read', description: 'View workflows' },
  { key: 'workflow.execute', resource: 'workflow', action: 'execute', description: 'Execute workflows' },
];

// Define role permission mappings (using permission keys)
const ROLE_PERMISSIONS = {
  ADMIN: [
    // Full access to all resources
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'role.assign_permissions',
    'permission.read',
    'staff.invite',
    'staff.read',
    'staff.update',
    'staff.remove',
    'audit.read',
    'audit.export',
    'competency.create',
    'competency.read',
    'competency.update',
    'competency.delete',
    'role_profile.create',
    'role_profile.read',
    'role_profile.update',
    'role_profile.delete',
    'goal.create',
    'goal.read',
    'goal.update',
    'goal.delete',
    'review.create',
    'review.read',
    'review.update',
    'review.delete',
    'assessment.read',
    'assessment.update',
    'workflow.read',
    'workflow.execute',
  ],
  DEPARTMENT_HEAD: [
    // Department-level permissions
    'competency.read',
    'role_profile.read',
    'goal.create',
    'goal.read',
    'goal.update',
    'review.create',
    'review.read',
    'review.update',
    'assessment.read',
    'workflow.read',
  ],
  MANAGER: [
    // Manager permissions
    'competency.read',
    'role_profile.read',
    'goal.create',
    'goal.read',
    'goal.update',
    'review.create',
    'review.read',
    'review.update',
    'assessment.read',
  ],
  EMPLOYEE: [
    // Employee self-service permissions
    'competency.read',
    'role_profile.read',
    'goal.create',
    'goal.read',
    'goal.update',
    'review.read',
    'assessment.create',
    'assessment.read',
    'workflow.read',
  ],
  REVIEWER: [
    // Reviewer permissions
    'competency.read',
    'role_profile.read',
    'goal.read',
    'review.create',
    'review.read',
    'review.update',
    'assessment.read',
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
        key: perm.key,
      },
      update: {
        description: perm.description,
      },
      create: {
        key: perm.key,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });

    permissionMap.set(perm.key, permission.id);
    console.log(`  ✓ ${perm.key}`);
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
