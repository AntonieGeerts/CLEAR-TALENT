import { Router } from 'express';
import { CompetencyController } from '../controllers/competency-controller';
import { asyncHandler } from '../middleware/error-handler';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createCompetencySchema,
  updateCompetencySchema,
  competencyQuerySchema,
} from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and create competencies
router.get('/', validateQuery(competencyQuerySchema), asyncHandler(CompetencyController.list));
router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER'),
  validateBody(createCompetencySchema),
  asyncHandler(CompetencyController.create)
);

// Get, update, delete specific competency
router.get('/:id', asyncHandler(CompetencyController.getById));
router.put(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  validateBody(updateCompetencySchema),
  asyncHandler(CompetencyController.update)
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(CompetencyController.delete)
);

export default router;
