import { Router } from 'express';
import { PIPController } from '../controllers/pip-controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.get('/', asyncHandler(PIPController.getPIPs));
router.get('/:id', asyncHandler(PIPController.getPIP));
router.post('/', asyncHandler(PIPController.createPIP));
router.put('/:id', asyncHandler(PIPController.updatePIP));
router.post('/:id/check-in', asyncHandler(PIPController.addCheckIn));
router.post('/:id/complete', asyncHandler(PIPController.completePIP));

export default router;
