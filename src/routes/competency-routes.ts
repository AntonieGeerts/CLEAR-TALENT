import { Router } from 'express';
import { CompetencyController } from '../controllers/competency-controller';
import { CompetencyQuestionController } from '../controllers/competency-question-controller';
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

// Question management routes
router.get(
  '/:competencyId/questions',
  asyncHandler(CompetencyQuestionController.getByCompetency)
);
router.post(
  '/:competencyId/questions',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(CompetencyQuestionController.create)
);
router.put(
  '/questions/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(CompetencyQuestionController.update)
);
router.delete(
  '/questions/:id',
  requireRole('ADMIN', 'HR_MANAGER'),
  asyncHandler(CompetencyQuestionController.delete)
);

export default router;
