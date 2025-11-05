import { Router } from 'express';
import { TenantController } from '../controllers/tenant-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// All routes require SYSTEM_ADMIN role (checked in controller)

router.put('/:userId', asyncHandler(TenantController.updateUser));
router.delete('/:userId', asyncHandler(TenantController.deleteUser));
router.post('/:userId/reset-password', asyncHandler(TenantController.resetUserPassword));

export default router;
