# Access Control Setup Guide

This guide explains how to set up the Role-Based Access Control (RBAC) system in CLEAR-TALENT.

## Overview

The access control system provides:
- **Role Management**: Create and manage custom roles
- **Permission System**: Granular permissions with ORG/TEAM/SELF scopes
- **Staff Management**: Invite and manage team members
- **Audit Logging**: Track all system activities

## Initial Setup

### 1. Run Database Migrations

The access control tables should already be created by the migration. If not, run:

```bash
npm run prisma:migrate:deploy
```

### 2. Seed Permissions

**Important**: This step is required for the admin UI to work!

The system needs permissions to be created and assigned to roles. Run the permissions seeding script:

```bash
npm run seed:permissions
```

This script will:
- Create 50+ granular permissions across all resources
- Assign appropriate permissions to system default roles (ADMIN, MANAGER, EMPLOYEE, etc.)
- Set up proper scope levels (ORG, TEAM, SELF)

### 3. Verify Setup

After seeding permissions, verify the setup by:

1. Log in as an ADMIN user
2. Navigate to **Administration** in the sidebar
3. You should see three submenu items:
   - Roles & Permissions
   - Staff Management
   - Audit Logs

If you see "Failed to load roles" or "Failed to load staff", the permissions were not seeded correctly.

## Permission System

### Permission Structure

Each permission has three components:

- **Resource**: What the permission applies to (e.g., `role`, `staff`, `competency`)
- **Action**: What action can be performed (e.g., `create`, `read`, `update`, `delete`)
- **Scope**: At what level the permission applies:
  - `ORG`: Organization-wide access
  - `TEAM`: Team/department level access
  - `SELF`: Self-service only

Example: `competency:read:ORG` allows reading all competencies in the organization.

### System Default Roles

The following roles are created by default with appropriate permissions:

#### ADMIN (Organizational Administrator)
- Full access to all resources at ORG level
- Can manage roles, permissions, and staff
- Can view all audit logs
- Complete control over organizational settings

#### DEPARTMENT_HEAD
- Team-level management permissions
- Can create and manage team goals
- Can conduct team reviews
- View team assessments

#### MANAGER
- Team oversight permissions
- Can manage team member goals
- Can create and update team reviews
- View team competencies and role profiles

#### EMPLOYEE
- Self-service permissions only
- Can view and update own goals
- Can view own reviews and assessments
- Can create self-assessments

#### REVIEWER
- Review-focused permissions
- Can read team competencies and goals
- Can create and update reviews for team members
- Read-only access to team assessments

## Custom Roles

Administrators can create custom roles with any combination of permissions:

1. Go to **Administration** → **Roles & Permissions**
2. Click **Create Role**
3. Enter role name, key, and description
4. Select permissions by resource type
5. Click **Create Role**

## Staff Management

### Inviting Staff Members

1. Go to **Administration** → **Staff Management**
2. Click **Invite Staff**
3. Fill in:
   - Email address
   - First and last name
   - Primary role
   - Additional roles (optional)
   - Position and department (optional)
4. Click **Send Invitation**

The invited user will receive an email with an invitation link.

### Managing Staff

- **Edit Members**: Update roles, status, position, or department
- **Suspend Members**: Change status to SUSPENDED to restrict access
- **Remove Members**: Delete staff membership (cannot be undone)

### Filtering Staff

Use the filters to find staff members:
- **Status**: Active, Suspended, or Pending
- **Role**: Filter by primary role
- **Search**: Search by name, email, position, or department

## Audit Logs

All system activities are automatically logged for compliance and security.

### Viewing Audit Logs

1. Go to **Administration** → **Audit Logs**
2. Use filters to narrow down logs:
   - Event type
   - Resource type
   - Date range
3. Search for specific activities

### Exporting Audit Logs

Click **Export CSV** to download audit logs for:
- Compliance reporting
- Security analysis
- Activity tracking

The export includes:
- Event details
- Actor information
- Timestamps
- IP addresses
- User agents
- Metadata

## Troubleshooting

### "Failed to load roles" Error

**Cause**: Permissions not seeded in database.

**Solution**: Run `npm run seed:permissions` in your production environment.

### "Failed to load staff" Error

**Cause**: Permissions not seeded or authorization middleware failing.

**Solution**:
1. Verify permissions are seeded: Check the `Permission` table in database
2. Verify role permissions: Check `RolePermission` table
3. Ensure ADMIN role has proper permissions assigned

### Admin Menu Not Showing

**Cause**: User does not have ADMIN role.

**Solution**: Update user role in database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Permission Denied Errors

**Cause**: User role doesn't have required permissions.

**Solution**:
1. Check what permissions the role has in **Roles & Permissions**
2. Add missing permissions to the role
3. Or assign an additional role with the needed permissions

## Database Schema

Key tables:

- `Role`: Stores role definitions
- `Permission`: Stores all available permissions
- `RolePermission`: Maps permissions to roles
- `TenantUserMembership`: Maps users to roles within tenants
- `AuditLog`: Stores all system activities

## Security Considerations

- **Tenant Isolation**: All data is automatically scoped to the tenant
- **Row-Level Security**: Middleware enforces tenant boundaries
- **Permission Checks**: Every admin operation checks permissions
- **Audit Trail**: All actions are logged with actor and timestamp
- **Role Protection**: System default roles cannot be deleted

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the PR documentation
- Contact your system administrator
