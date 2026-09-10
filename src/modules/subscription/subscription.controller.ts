import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { SubscriptionService } from './subscription.service';

const createSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createSubscription(req.user.userId, req.body);
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Redirect the user to checkoutUrl to complete payment', data: result });
});

// admin-only — create an active subscription without payment (testing / manual grants)
const adminCreateSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.adminCreateSubscription(req.body);
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Subscription created without payment', data: result });
});

const getMySubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getMySubscriptions(req.user.userId);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const getSubscriptionById = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getSubscriptionById(req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const cancelSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.cancelSubscription(req.user.userId, req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, message: 'Subscription cancelled', data: result });
});

const renewSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.renewSubscription(req.user.userId, req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, message: 'Renewal payment initiated', data: result });
});


// admin — paginated list of all subscriptions
const getAllSubscriptions = catchAsync(async (req, res) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const { results, pagination } = await SubscriptionService.getAllSubscriptions(page, limit);
  sendResponse(res, { code: StatusCodes.OK, data: results, pagination });
});

// admin — activate / deactivate a subscription
const adminUpdateSubscriptionStatus = catchAsync(async (req, res) => {
  const result = await SubscriptionService.adminUpdateSubscriptionStatus(req.params.id as string, req.body.status);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: req.body.status === 'active' ? 'Subscription activated' : 'Subscription deactivated',
    data: result,
  });
});
export const SubscriptionController = {
  createSubscription,
  adminCreateSubscription,
  getMySubscriptions,
  getSubscriptionById,
  cancelSubscription,
  renewSubscription,
  getAllSubscriptions,
  adminUpdateSubscriptionStatus,
};
