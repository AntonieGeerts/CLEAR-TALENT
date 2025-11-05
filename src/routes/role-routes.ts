import { Router } from 'express';
import { RoleController } from '../controllers/role-controller';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and create role profiles
router.get('/', asyncHandler(RoleController.list));
router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(RoleController.create)
);

// Get, update, delete specific role profile
router.get('/:id', asyncHandler(RoleController.getById));
router.put(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(RoleController.update)
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(RoleController.delete)
);

// Clone role profile as template
router.post(
  '/:id/clone',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(RoleController.clone)
);

export default router;
