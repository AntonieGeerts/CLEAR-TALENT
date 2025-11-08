import { Router } from 'express';
import authRoutes from './auth-routes';
import competencyRoutes from './competency-routes';
import scoringSystemRoutes from './scoring-system-routes';
import aiRoutes from './ai-routes';
import roleRoutes from './role-routes';
import workflowRoutes from './workflow-routes';
import setupRoutes from './setup-routes';
import tenantRoutes from './tenant-routes';
import userRoutes from './user-routes';
import organizationalGoalsRoutes from './organizational-goals-routes';
import goalsRoutes from './goals-routes';
import pipRoutes from './pip-routes';
import adminRoutes from './admin-routes';
import rbacRoutes from './rbac-routes';
import staffRoutes from './staff-routes';
import auditRoutes from './audit-routes';
import assessmentRoutes from './assessment-routes';
import idpRoutes from './idp-routes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CLEARTalent API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    stage: 'Production - Multi-Tenant PMDS',
  });
});

// Public routes
router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/admin', adminRoutes); // Temporary admin endpoints for setup

// Protected routes (require authentication)
router.use('/competencies', authenticate, competencyRoutes);
router.use('/scoring-systems', authenticate, scoringSystemRoutes);
router.use('/roles', authenticate, roleRoutes);
router.use('/ai', authenticate, aiRoutes);
router.use('/workflows', authenticate, workflowRoutes);
router.use('/organizational-goals', authenticate, organizationalGoalsRoutes);
router.use('/goals', authenticate, goalsRoutes);
router.use('/pips', authenticate, pipRoutes);
router.use('/assessments', authenticate, assessmentRoutes);
router.use('/idps', authenticate, idpRoutes);

// System Admin routes
router.use('/tenants', authenticate, tenantRoutes);
router.use('/users', authenticate, userRoutes);

// Access Control routes (RBAC, Staff, Audit)
router.use('/rbac', rbacRoutes); // Authentication handled within routes
router.use('/staff', staffRoutes); // Has public endpoint for invitation acceptance
router.use('/audit', auditRoutes); // Authentication handled within routes

export default router;
