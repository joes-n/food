import { Router } from 'express';
import {
  createOrder,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  assignDriver,
  cancelOrder,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  uuidSchema,
  paginationSchema,
} from '../utils/validations';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create order (customers only)
router.post(
  '/',
  authorize('customer'),
  validate(createOrderSchema),
  createOrder
);

// Get my orders
router.get('/my', validate(paginationSchema), getMyOrders);

// Get order by ID
router.get('/:id', validate(uuidSchema), getOrder);

// Update order status
router.put(
  '/:id/status',
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Assign driver (restaurant owners, admins, drivers)
router.put(
  '/:orderId/assign-driver',
  authorize('restaurant_owner', 'admin', 'driver'),
  assignDriver
);

// Cancel order
router.put('/:id/cancel', cancelOrder);

export default router;
