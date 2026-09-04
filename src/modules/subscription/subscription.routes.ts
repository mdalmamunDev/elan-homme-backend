import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionValidation } from './subscription.validation';

const router = Router();

router.post(
  '/',
  auth('common'),
  validateRequest(SubscriptionValidation.createSubscriptionValidationSchema),
  SubscriptionController.createSubscription
);
router.get('/me', auth('common'), SubscriptionController.getMySubscriptions);
router.get('/:id', auth('common'), SubscriptionController.getSubscriptionById);
router.patch('/:id/cancel', auth('common'), SubscriptionController.cancelSubscription);
router.post('/:id/renew', auth('common'), SubscriptionController.renewSubscription);

export const SubscriptionRoutes = router;
