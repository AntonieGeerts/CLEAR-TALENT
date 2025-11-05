import { Router } from 'express';
import { SetupController } from '../controllers/setup-controller';

const router = Router();

// Database setup endpoints
router.post('/migrate', SetupController.runMigrations);
router.post('/seed', SetupController.seedDatabase);
router.post('/init-db', SetupController.initializeDatabase);

export default router;
