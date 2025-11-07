import { Router } from 'express';
import { AIController } from '../controllers/ai-controller';
import { asyncHandler } from '../middleware/error-handler';
import { validateBody } from '../middleware/validation';
import { authenticate, checkAIOptOut } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rate-limit';
import {
  suggestFromJDSchema,
  generateIndicatorsSchema,
  improveTextSchema,
  summarizeTextSchema,
} from '../utils/validators';

const router = Router();

// All AI routes require authentication and check AI opt-out
router.use(authenticate, checkAIOptOut, aiRateLimiter);

// Competency AI operations
router.post(
  '/competencies/suggest-from-jd',
  validateBody(suggestFromJDSchema),
  asyncHandler(AIController.suggestFromJD)
);

router.post(
  '/competencies/:id/generate-indicators',
  validateBody(generateIndicatorsSchema),
  asyncHandler(AIController.generateIndicators)
);

router.post(
  '/competencies/:id/generate-levels',
  asyncHandler(AIController.generateLevels)
);

router.post(
  '/competencies/:id/create-levels',
  asyncHandler(AIController.createLevelsFromAI)
);

router.post(
  '/competencies/generate-by-category',
  asyncHandler(AIController.generateByCategory)
);

// AI assessment question generation
router.post(
  '/competencies/:id/generate-assessment-questions',
  asyncHandler(AIController.generateAssessmentQuestions)
);

router.post(
  '/competencies/:id/save-assessment-questions',
  asyncHandler(AIController.saveAssessmentQuestions)
);

// Text AI operations
router.post(
  '/text/improve',
  validateBody(improveTextSchema),
  asyncHandler(AIController.improveText)
);

router.post(
  '/text/summarize',
  validateBody(summarizeTextSchema),
  asyncHandler(AIController.summarizeText)
);

router.post(
  '/text/rewrite',
  asyncHandler(AIController.rewriteText)
);

router.post(
  '/text/structure-feedback',
  asyncHandler(AIController.structureFeedback)
);

export default router;
