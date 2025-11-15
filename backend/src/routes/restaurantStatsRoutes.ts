import { Router } from 'express';
import { getRestaurantStats } from '../controllers/restaurantStatsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticate);

router.get('/:restaurantId', getRestaurantStats);

export default router;