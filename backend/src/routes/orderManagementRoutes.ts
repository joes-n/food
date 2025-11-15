import { Router } from 'express';
import {
  getRestaurantOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
} from '../controllers/orderManagementController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uuidSchema } from '../utils/validations';

const router = Router();

// Protected routes
router.use(authenticate);

router.get('/restaurant/:restaurantId', getRestaurantOrders);
router.put('/:id/status', validate(uuidSchema), updateOrderStatus);
router.post('/:id/accept', validate(uuidSchema), acceptOrder);
router.post('/:id/reject', validate(uuidSchema), rejectOrder);

export default router;