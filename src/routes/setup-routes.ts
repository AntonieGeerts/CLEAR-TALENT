import { Router } from 'express';
import { SetupController } from '../controllers/setup-controller';

const router = Router();

// Database initialization endpoint
// WARNING: In production, this should be protected or removed!
router.post('/init-db', SetupController.initializeDatabase);

export default router;
