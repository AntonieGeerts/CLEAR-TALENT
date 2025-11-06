import { Router } from 'express';
import { GoalsController } from '../controllers/goals-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// Goal CRUD operations
router.get('/', asyncHandler(GoalsController.getGoals));
router.get('/stats', asyncHandler(GoalsController.getGoalStats));
router.get('/:id', asyncHandler(GoalsController.getGoal));
router.post('/', asyncHandler(GoalsController.createGoal));
router.put('/:id', asyncHandler(GoalsController.updateGoal));
router.delete('/:id', asyncHandler(GoalsController.deleteGoal));

export default router;
