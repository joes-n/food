import { Router } from 'express';
import {
  getAvailableDeliveries,
  acceptDelivery,
  updateDriverStatus,
  updateDriverLocation,
  updateDeliveryStatus,
  getDriverEarnings,
  getMyDeliveries
} from '../controllers/driverController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uuidSchema } from '../utils/validations';

const router = Router();
router.use(authenticate);

router.get('/available-deliveries', getAvailableDeliveries);
router.post('/deliveries/:id/accept', validate(uuidSchema), acceptDelivery);
router.put('/status', updateDriverStatus);
router.put('/location', updateDriverLocation);
router.put('/deliveries/:id/status', validate(uuidSchema), updateDeliveryStatus);
router.get('/earnings', getDriverEarnings);
router.get('/deliveries', getMyDeliveries);

export default router;