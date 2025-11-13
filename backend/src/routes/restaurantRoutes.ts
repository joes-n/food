import { Router } from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurants,
} from '../controllers/restaurantController';
import { authenticate, authorize } from '../middleware/auth';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  uuidSchema,
  paginationSchema,
} from '../utils/validations';
import { validate } from '../middleware/validate';

const router = Router();

// Public routes
router.get('/', validate(paginationSchema), getRestaurants);
router.get('/:id', validate(uuidSchema), getRestaurantById);

// Protected routes
router.use(authenticate);

router.get('/my/all', getMyRestaurants);
router.post('/', validate(createRestaurantSchema), createRestaurant);
router.put('/:id', validate(updateRestaurantSchema), updateRestaurant);
router.delete('/:id', validate(uuidSchema), deleteRestaurant);

export default router;
