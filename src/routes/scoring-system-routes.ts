import { Router } from 'express';
import { ScoringSystemController } from '../controllers/scoring-system-controller';
import { requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// Get all scoring systems for tenant
router.get('/', asyncHandler(ScoringSystemController.getAll));

// Get default scoring system
router.get('/default', asyncHandler(ScoringSystemController.getDefault));

// Get a specific scoring system
router.get('/:id', asyncHandler(ScoringSystemController.getById));

// Create a custom scoring system (Admin only)
router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(ScoringSystemController.create)
);

// Update a scoring system (Admin only)
router.put(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(ScoringSystemController.update)
);

// Set as default scoring system (Admin only)
router.post(
  '/:id/set-default',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(ScoringSystemController.setDefault)
);

// Delete a scoring system (Admin only)
router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(ScoringSystemController.delete)
);

// Calculate score using a scoring system
router.post(
  '/:systemId/calculate',
  asyncHandler(ScoringSystemController.calculateScore)
);

export default router;
