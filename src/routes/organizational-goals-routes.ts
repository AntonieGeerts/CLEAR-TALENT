import { Router } from 'express';
import { OrganizationalGoalsController } from '../controllers/organizational-goals-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.get('/', asyncHandler(OrganizationalGoalsController.getGoals));
router.get('/tree', asyncHandler(OrganizationalGoalsController.getGoalTree));
router.get('/alignment-report', asyncHandler(OrganizationalGoalsController.getAlignmentReport));
router.get('/:id', asyncHandler(OrganizationalGoalsController.getGoal));
router.post('/', asyncHandler(OrganizationalGoalsController.createGoal));
router.put('/:id', asyncHandler(OrganizationalGoalsController.updateGoal));
router.delete('/:id', asyncHandler(OrganizationalGoalsController.deleteGoal));

export default router;
