import { Router } from 'express';
import { TenantController } from '../controllers/tenant-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// All routes require SYSTEM_ADMIN role (checked in controller)

router.get('/', asyncHandler(TenantController.getAllTenants));
router.get('/stats', asyncHandler(TenantController.getTenantStats));

// User management within tenant (must be before /:id to avoid conflicts)
router.post('/:tenantId/users', asyncHandler(TenantController.createUserForTenant));

router.get('/:id', asyncHandler(TenantController.getTenant));
router.post('/', asyncHandler(TenantController.createTenant));
router.put('/:id', asyncHandler(TenantController.updateTenant));
router.post('/:id/deactivate', asyncHandler(TenantController.deactivateTenant));

export default router;
