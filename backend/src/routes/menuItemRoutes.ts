import { Router } from 'express';
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuItemController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uuidSchema } from '../utils/validations';

const router = Router();

// Public routes
router.get('/', getMenuItems);
router.get('/:id', validate(uuidSchema), getMenuItemById);

// Protected routes
router.use(authenticate);

router.post('/', createMenuItem);
router.put('/:id', validate(uuidSchema), updateMenuItem);
router.delete('/:id', validate(uuidSchema), deleteMenuItem);

export default router;