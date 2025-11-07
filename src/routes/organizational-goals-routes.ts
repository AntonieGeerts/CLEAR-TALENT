import { Router } from 'express';
import { OrganizationalGoalsController } from '../controllers/organizational-goals-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// GET routes
router.get('/', asyncHandler(OrganizationalGoalsController.getGoals));
router.get('/by-level', asyncHandler(OrganizationalGoalsController.getGoalsByLevel));
router.get('/tree', asyncHandler(OrganizationalGoalsController.getGoalTree));
router.get('/alignment-report', asyncHandler(OrganizationalGoalsController.getAlignmentReport));
router.get('/:id', asyncHandler(OrganizationalGoalsController.getGoal));

// POST routes
router.post('/', asyncHandler(OrganizationalGoalsController.createGoal));
router.post('/generate-ai', asyncHandler(OrganizationalGoalsController.generateStrategicGoals));
router.post('/create-from-ai', asyncHandler(OrganizationalGoalsController.createGoalsFromAI));
router.post('/generate-child-goals', asyncHandler(OrganizationalGoalsController.generateChildGoals));
router.post('/create-child-goals', asyncHandler(OrganizationalGoalsController.createChildGoalsFromAI));
router.post('/generate-kpis', asyncHandler(OrganizationalGoalsController.generateKPIsForGoal));

// PUT routes
router.put('/:id', asyncHandler(OrganizationalGoalsController.updateGoal));
router.put('/:id/kpis', asyncHandler(OrganizationalGoalsController.updateGoalKPIs));

// DELETE routes
router.delete('/all', asyncHandler(OrganizationalGoalsController.deleteAllGoals));
router.delete('/:id', asyncHandler(OrganizationalGoalsController.deleteGoal));

export default router;
