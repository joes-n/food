import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  handleWebhook,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';
import { uuidSchema } from '../utils/validations';
import { validate } from '../middleware/validate';
import bodyParser from 'body-parser';

const router = Router();

// Webhook route (no auth required, uses raw body)
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  handleWebhook
);

// Protected routes
router.use(authenticate);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/refund', authorize('admin'), processRefund);

export default router;
