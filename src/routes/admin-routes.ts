import { Router } from 'express';
import { AdminController } from '../controllers/admin-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * Temporary admin endpoint to install AI prompt template
 * This can be called via browser to set up production database
 *
 * Usage: GET https://your-domain.com/api/v1/admin/install-goal-template
 */
router.get('/install-goal-template', asyncHandler(AdminController.installGoalTemplate));

export default router;
