import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow-controller';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, checkAIOptOut } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rate-limit';

const router = Router();

// All AI workflow routes require authentication and check AI opt-out
router.use(authenticate, checkAIOptOut, aiRateLimiter);

// Goal suggestions (S2.2)
router.post('/goals/suggest', asyncHandler(WorkflowController.suggestGoals));

// Skill gap detection (S2.3)
router.post('/skill-gaps/detect', asyncHandler(WorkflowController.detectSkillGaps));

// Individual Development Plans (S2.4)
router.post('/idp/generate', asyncHandler(WorkflowController.generateIDP));
router.post('/idp/save', asyncHandler(WorkflowController.saveIDP));

// Feedback sentiment analysis (S2.5)
router.post('/feedback/analyze', asyncHandler(WorkflowController.analyzeFeedback));
router.get(
  '/feedback/analyze/:employeeId',
  asyncHandler(WorkflowController.analyzeFeedbackForEmployee)
);

// Learning path suggestions (S2.6)
router.post('/learning-path/suggest', asyncHandler(WorkflowController.suggestLearningPath));

export default router;
