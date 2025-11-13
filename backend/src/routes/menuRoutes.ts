import { Router } from 'express';
import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addMenuItemCustomization,
  addCustomizationOption,
} from '../controllers/menuController';
import { authenticate } from '../middleware/auth';
import { uuidSchema } from '../utils/validations';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Menu Category routes
router.post('/categories', validate(uuidSchema), createMenuCategory);
router.put('/categories/:id', validate(uuidSchema), updateMenuCategory);
router.delete('/categories/:id', validate(uuidSchema), deleteMenuCategory);

// Menu Item routes
router.post('/items', validate(uuidSchema), createMenuItem);
router.put('/items/:id', validate(uuidSchema), updateMenuItem);
router.delete('/items/:id', validate(uuidSchema), deleteMenuItem);

// Customization routes
router.post('/customizations', validate(uuidSchema), addMenuItemCustomization);
router.post('/customization-options', validate(uuidSchema), addCustomizationOption);

export default router;
