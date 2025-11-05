import { Router } from 'express';
import authRoutes from './auth-routes';
import competencyRoutes from './competency-routes';
import aiRoutes from './ai-routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CLEAR-TALENT API is running',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/competencies', competencyRoutes);
router.use('/ai', aiRoutes);

export default router;
