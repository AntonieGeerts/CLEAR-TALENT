import { Router } from 'express';
import { OrganizationalGoalsController } from '../controllers/organizational-goals-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.get('/', asyncHandler(OrganizationalGoalsController.getGoals));
router.get('/tree', asyncHandler(OrganizationalGoalsController.getGoalTree));
router.get('/alignment-report', asyncHandler(OrganizationalGoalsController.getAlignmentReport));
router.get('/:id', asyncHandler(OrganizationalGoalsController.getGoal));
router.post('/', asyncHandler(OrganizationalGoalsController.createGoal));
router.post('/generate-ai', asyncHandler(OrganizationalGoalsController.generateStrategicGoals));
router.post('/create-from-ai', asyncHandler(OrganizationalGoalsController.createGoalsFromAI));
router.post('/generate-kpis', asyncHandler(OrganizationalGoalsController.generateKPIsForGoal));
router.put('/:id', asyncHandler(OrganizationalGoalsController.updateGoal));
router.put('/:id/kpis', asyncHandler(OrganizationalGoalsController.updateGoalKPIs));
router.delete('/all', asyncHandler(OrganizationalGoalsController.deleteAllGoals));
router.delete('/:id', asyncHandler(OrganizationalGoalsController.deleteGoal));

export default router;
