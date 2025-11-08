import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { IDPController } from '../controllers/idp-controller';

const router = Router();

router.get('/', asyncHandler(IDPController.list));
router.get('/:id', asyncHandler(IDPController.getById));
router.post('/', asyncHandler(IDPController.create));
router.put('/:id', asyncHandler(IDPController.update));
router.delete('/:id', asyncHandler(IDPController.remove));

export default router;
