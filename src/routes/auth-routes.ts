import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { asyncHandler } from '../middleware/error-handler';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { loginSchema, registerSchema } from '../utils/validators';

const router = Router();

// Public routes
router.post('/login', authRateLimiter, validateBody(loginSchema), asyncHandler(AuthController.login));
router.post('/register', validateBody(registerSchema), asyncHandler(AuthController.register));
router.post('/refresh', asyncHandler(AuthController.refresh));

// Protected routes
router.get('/me', authenticate, asyncHandler(AuthController.me));
router.post('/logout', authenticate, asyncHandler(AuthController.logout));

export default router;
