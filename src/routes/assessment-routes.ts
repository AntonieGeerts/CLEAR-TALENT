import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment-controller';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's assessment history
router.get('/my-assessments', asyncHandler(AssessmentController.getMyAssessments));

// Create new assessment
router.post('/', asyncHandler(AssessmentController.create));

// Get assessment by ID
router.get('/:id', asyncHandler(AssessmentController.getById));

// Submit response to a question
router.post('/:id/responses', asyncHandler(AssessmentController.submitResponse));

// Complete assessment
router.post('/:id/complete', asyncHandler(AssessmentController.complete));

// Get assessment results
router.get('/:id/results', asyncHandler(AssessmentController.getResults));

export default router;
