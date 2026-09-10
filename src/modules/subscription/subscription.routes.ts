import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionValidation } from './subscription.validation';

const router = Router();

// admin — paginated list of all subscriptions
router.get('/all', auth('admin'), SubscriptionController.getAllSubscriptions);

// admin — activate / deactivate a subscription
router.patch(
  '/:id/status',
  auth('admin'),
  validateRequest(SubscriptionValidation.adminUpdateSubscriptionStatusValidationSchema),
  SubscriptionController.adminUpdateSubscriptionStatus
);

// admin — create an active subscription without payment (testing / manual grants)
router.post(
  '/admin-create',
  auth('admin'),
  validateRequest(SubscriptionValidation.adminCreateSubscriptionValidationSchema),
  SubscriptionController.adminCreateSubscription
);

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
