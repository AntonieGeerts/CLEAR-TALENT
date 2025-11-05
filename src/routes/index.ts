import { Router } from 'express';
import authRoutes from './auth-routes';
import competencyRoutes from './competency-routes';
import aiRoutes from './ai-routes';
import roleRoutes from './role-routes';
import workflowRoutes from './workflow-routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CLEAR-TALENT API is running',
    timestamp: new Date().toISOString(),
    version: '0.2.0', // Updated to Stage 2
    stage: 'Stage 2 - AI-Assisted Workflows',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/competencies', competencyRoutes);
router.use('/roles', roleRoutes);
router.use('/ai', aiRoutes);
router.use('/workflows', workflowRoutes);

export default router;
