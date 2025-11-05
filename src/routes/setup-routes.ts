import { Router } from 'express';
import { SetupController } from '../controllers/setup-controller';

const router = Router();

// Database setup endpoints
router.post('/push-schema', SetupController.pushSchema);
router.post('/migrate', SetupController.runMigrations);
router.post('/seed', SetupController.seedDatabase);
router.post('/init-db', SetupController.initializeDatabase);
router.post('/create-sysadmin', SetupController.createSystemAdmin);

export default router;
