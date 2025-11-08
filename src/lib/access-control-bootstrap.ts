import { PrismaClient, Prisma, UserRole, TenantUserMembership, Tenant } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SYSTEM_ROLE_DEFINITIONS,
  mapLegacyRoleToSystemRole,
  SystemRoleKey,
} from './access-control-defaults';

type MembershipWithTenant = TenantUserMembership & { tenant: Tenant };

type LogFn = (message: string) => void;

async function ensurePermissions(prisma: PrismaClient, log: LogFn) {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    });
  }
  log(`Permissions ensured (${PERMISSIONS.length})`);
}

async function upsertSystemRole(prisma: PrismaClient, key: SystemRoleKey) {
  const def = SYSTEM_ROLE_DEFINITIONS[key];
  const existing = await prisma.role.findFirst({
    where: {
      key,
      tenantId: null,
    },
  });

  if (existing) {
    return prisma.role.update({
      where: { id: existing.id },
      data: {
        name: def.name,
        description: def.description,
        isSystemDefault: def.isSystemDefault,
        isEditable: def.isEditable,
      },
    });
  }

  return prisma.role.create({
    data: {
      tenantId: null,
      key,
      name: def.name,
      description: def.description,
      isSystemDefault: def.isSystemDefault,
      isEditable: def.isEditable,
    },
  });
}

async function ensureSystemRoles(prisma: PrismaClient, log: LogFn) {
  for (const key of Object.keys(SYSTEM_ROLE_DEFINITIONS) as SystemRoleKey[]) {
    await upsertSystemRole(prisma, key);
  }
  log(`System roles ensured (${Object.keys(SYSTEM_ROLE_DEFINITIONS).length})`);
}

async function ensureRolePermissions(prisma: PrismaClient, log: LogFn) {
  for (const [roleKey, permissionList] of Object.entries(ROLE_PERMISSIONS) as Array<[
    SystemRoleKey,
    typeof ROLE_PERMISSIONS[SystemRoleKey]
  ]>) {
    const role = await prisma.role.findFirst({
      where: { key: roleKey, tenantId: null },
    });

    if (!role) {
      logger.warn(`System role ${roleKey} missing while assigning permissions`);
      continue;
    }

    for (const permDef of permissionList) {
      const permission = await prisma.permission.findUnique({
        where: { key: permDef.permissionKey },
      });

      if (!permission) {
        logger.warn(`Permission ${permDef.permissionKey} missing for role ${roleKey}`);
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
          scope: permDef.scope,
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
          tenantId: null,
          scope: permDef.scope,
        },
      });
    }
  }
  log('Role permissions ensured');
}

export async function seedAccessControl(prisma: PrismaClient, log: LogFn = msg => logger.info(msg)) {
  await ensurePermissions(prisma, log);
  await ensureSystemRoles(prisma, log);
  await ensureRolePermissions(prisma, log);
}

export async function provisionMembershipForUser(
  prisma: PrismaClient,
  user: { id: string; tenantId: string | null; role: UserRole }
): Promise<MembershipWithTenant | null> {
  if (!user.tenantId) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) {
    logger.warn('Tenant missing while provisioning membership', {
      tenantId: user.tenantId,
      userId: user.id,
    });
    return null;
  }

  const roleKey = mapLegacyRoleToSystemRole(user.role);
  const role = await upsertSystemRole(prisma, roleKey);

  try {
    const membership = await prisma.tenantUserMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        primaryRoleId: role.id,
        status: 'ACTIVE',
      },
      include: { tenant: true },
    });

    logger.info('Auto-provisioned tenant membership', {
      tenantId: tenant.id,
      userId: user.id,
      roleKey,
    });

    return membership;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return prisma.tenantUserMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: user.id,
          },
        },
        include: { tenant: true },
      });
    }
    throw error;
  }
}

export async function backfillLegacyMemberships(prisma: PrismaClient): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      tenantId: {
        not: null,
      },
      role: {
        not: UserRole.SYSTEM_ADMIN,
      },
      memberships: {
        none: {},
      },
    },
    select: {
      id: true,
      tenantId: true,
      role: true,
    },
  });

  let created = 0;

  for (const user of users) {
    const membership = await provisionMembershipForUser(prisma, user as {
      id: string;
      tenantId: string | null;
      role: UserRole;
    });

    if (membership) {
      created += 1;
    }
  }

  if (created > 0) {
    logger.info('Backfilled tenant memberships for legacy users', { count: created });
  }

  return created;
}
