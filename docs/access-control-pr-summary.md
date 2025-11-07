# Access Control & RBAC System - PR Summary

## Overview

This PR implements the foundation for a comprehensive access control and role-based access control (RBAC) system for the CLEAR-TALENT platform, based on the **Access Control & Organisation Admin Module Spec v0.1**.

## 🎯 Implementation Status

### ✅ Completed (Stage 1 Foundation)

#### 1. Database Schema & Migrations
- **New Enums**: `TenantPlan`, `MembershipStatus`, `InvitationStatus`, `PermissionScope`, `ApproverType`, `ApprovalStatus`, `ApprovalActionType`
- **New Tables**:
  - `tenant_user_memberships` - Flexible user-tenant-role relationships
  - `invitations` - Staff invitation workflow
  - `roles` - System and tenant-specific roles
  - `permissions` - Granular permission definitions
  - `role_permissions` - Role-permission mappings with scopes
  - `approval_flow_definitions` - Configurable approval workflows
  - `approval_steps` - Multi-step approval configuration
  - `approval_instances` - Runtime approval tracking
  - `approval_actions` - Approval decision history
  - `audit_logs` - Comprehensive audit trail
- **Schema Updates**:
  - Added `plan` field to Tenant model
  - Added `lastLoginAt` and `profile` fields to User model
  - All tables properly indexed for query performance
  - Foreign keys with appropriate cascade rules

#### 2. Seed Script
- **System Roles**: TENANT_OWNER, HR_ADMIN, LINE_MANAGER, EMPLOYEE, READ_ONLY
- **Permissions**: 23 standard permissions across:
  - Staff management
  - Role & permission management
  - Approval flows
  - Performance reviews
  - Goals & OKRs
  - Competencies
  - Development plans
  - Feedback
  - Reports & analytics
  - Audit logs
- **Role-Permission Mappings**: Preconfigured with appropriate scopes for each role
- **NPM Script**: `npm run seed:access-control`

#### 3. Core Services

**AccessControlService** (`src/services/access-control/access-control-service.ts`):
- Permission evaluation with 3-level scopes:
  - `ORG`: Organization-wide access
  - `TEAM`: Department/team-based access with manager hierarchy support
  - `SELF`: Self-service only
- Role resolution (primary + additional roles)
- Membership status validation
- Performance-optimized with caching (5-minute TTL)
- Methods:
  - `checkPermission()` - Single permission check
  - `checkPermissions()` - Batch permission checks
  - `getUserPermissions()` - Get all user permissions for UI
  - `clearCache()` - Cache invalidation

**AuditService** (`src/services/access-control/audit-service.ts`):
- Comprehensive event logging
- 25+ predefined event types
- Specialized logging methods:
  - `logStaffEvent()`
  - `logRoleEvent()`
  - `logApprovalFlowEvent()`
  - `logApprovalEvent()`
- Query capabilities:
  - `query()` - Flexible audit log querying
  - `getResourceAuditTrail()` - Resource-specific history
  - `getUserActivity()` - User action timeline
- CSV export for compliance
- Retention policy support (`deleteOldLogs()`)

### 🚧 Pending (Stage 1 Completion)

The following components are specified but not yet implemented:

#### 4. Additional Services
- [ ] **TenantService** - Tenant management operations
- [ ] **StaffService** - Staff invitation and management
- [ ] **RoleService** - Role and permission management
- [ ] **ApprovalFlowService** - Approval flow configuration

#### 5. Middleware
- [ ] **Authorization Middleware** - Permission-based route protection
- [ ] **Tenant Context Middleware** - Multi-tenant isolation

#### 6. API Endpoints
- [ ] **Staff Management**:
  - `POST /api/v1/tenants/:tenantId/staff/invite`
  - `GET /api/v1/tenants/:tenantId/staff`
  - `PATCH /api/v1/tenants/:tenantId/staff/:membershipId`
  - `POST /api/v1/invitations/:token/accept`
- [ ] **Role Management**:
  - `GET /api/v1/tenants/:tenantId/roles`
  - `POST /api/v1/tenants/:tenantId/roles`
  - `PATCH /api/v1/tenants/:tenantId/roles/:roleId`
  - `GET /api/v1/permissions`
- [ ] **Approval Flows**:
  - `GET /api/v1/tenants/:tenantId/approval-flows`
  - `POST /api/v1/tenants/:tenantId/approval-flows`
  - `PATCH /api/v1/tenants/:tenantId/approval-flows/:flowId`
- [ ] **Audit Logs**:
  - `GET /api/v1/tenants/:tenantId/audit-logs`
  - `GET /api/v1/tenants/:tenantId/audit-logs/export`

#### 7. Testing
- [ ] Unit tests for AccessControlService
- [ ] Unit tests for AuditService
- [ ] Integration tests for staff management endpoints
- [ ] Integration tests for role management endpoints
- [ ] Integration tests for approval flow endpoints
- [ ] Existing test suite compatibility verification

#### 8. Documentation
- [ ] API documentation for access control endpoints
- [ ] Integration guide for existing routes
- [ ] Migration guide from old UserRole enum to new RBAC

### 📋 Future Enhancements (Stage 2+)

- Custom roles per tenant with configurable permissions
- Advanced scoping (department, location, custom attributes)
- SSO / SCIM integration
- Fine-grained audit reporting and export
- Delegated administration (regional admins, department admins)
- Attribute-based access control (ABAC)

## 🏗️ Architecture Decisions

### Multi-Tenancy
- Every access control object is scoped to `tenantId`
- System roles (null `tenantId`) are shared across all tenants
- Row-level security can be implemented at the database level

### RBAC Model
- **Roles**: Container for permissions
- **Permissions**: Resource + action pairs (e.g., `staff.manage`)
- **Scopes**: Permission restrictions (SELF, TEAM, ORG)
- **Memberships**: User-tenant-role assignments

### Permission Evaluation Algorithm
1. Lookup active membership for tenant + user
2. Resolve all roles (primary + additional)
3. Find matching permission by resource.action
4. Evaluate scope against context (manager hierarchy, department, etc.)
5. Return allow/deny with reason

### Caching Strategy
- Membership cache: 5-minute TTL
- Role cache: 5-minute TTL
- Cache invalidation on role/membership changes
- Balance between performance and consistency

### Audit Logging
- Non-blocking (failures don't break main flow)
- Comprehensive event types for compliance
- Structured metadata for forensics
- Queryable with flexible filters

## 📊 Database Impact

**New Tables**: 10
**New Enums**: 8
**New Indexes**: 30+
**Estimated Row Growth** (per tenant):
- Roles: ~10-50 (system + custom)
- Permissions: ~50 (global)
- RolePermissions: ~200-500
- Memberships: = user count
- AuditLogs: ~1000/month per active user

## 🔐 Security Considerations

### Multi-Tenant Isolation
- All queries filtered by `tenantId`
- No cross-tenant visibility
- System admin role can access all tenants (for support)

### Permission Checks
- Fail-safe: deny by default
- Explicit permission required for all actions
- Scope evaluation prevents privilege escalation

### Audit Trail
- All sensitive actions logged
- Immutable audit log (no updates, only inserts)
- Retention policy for compliance

## 🚀 Getting Started

### Apply Migrations
```bash
npm run prisma:migrate:deploy
```

### Seed System Roles and Permissions
```bash
npm run seed:access-control
```

### Example Usage

#### Check Permission
```typescript
import { AccessControlService } from './services/access-control';

const accessControl = new AccessControlService();

const result = await accessControl.checkPermission({
  tenantId: 'tenant-123',
  userId: 'user-456',
  resource: 'staff',
  action: 'manage',
  context: { targetUserId: 'user-789' }
});

if (result.allowed) {
  // Proceed with action
} else {
  // Deny access
  console.log(result.reason);
}
```

#### Log Audit Event
```typescript
import { AuditService, AuditEventTypes } from './services/access-control';

const auditService = new AuditService();

await auditService.logStaffEvent(
  AuditEventTypes.STAFF_INVITED,
  'tenant-123',
  'inviter-user-id',
  'invitee-user-id',
  { email: 'newuser@example.com', roles: ['EMPLOYEE'] }
);
```

## 📝 Next Steps

1. **Complete Stage 1 Implementation**:
   - Implement remaining services (Staff, Role, Tenant, ApprovalFlow)
   - Create authorization and tenant context middleware
   - Build API endpoints
   - Write comprehensive tests
   - Update existing routes to use new authorization

2. **Documentation**:
   - API documentation
   - Integration guide
   - Migration guide

3. **Deployment**:
   - Run migrations on staging
   - Seed roles and permissions
   - Test with sample data
   - Deploy to production

4. **Monitor & Iterate**:
   - Track permission check performance
   - Monitor audit log volume
   - Gather user feedback
   - Plan Stage 2 enhancements

## 🤝 Contributing

This PR implements the foundation specified in **Access Control & Organisation Admin Module Spec v0.1**. Contributions for completing Stage 1 or implementing Stage 2 features are welcome.

---

**Related Specification**: Access Control & Organisation Admin Module Spec v0.1
**Implementation Stage**: Stage 1 (Foundation) - Partially Complete
**Branch**: `claude/access-control-rbac-module`
