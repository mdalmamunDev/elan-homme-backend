import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { SubscriptionService } from './subscription.service';

const createSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createSubscription(req.user.userId, req.body);
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Redirect the user to checkoutUrl to complete payment', data: result });
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

export const SubscriptionController = {
  createSubscription,
  getMySubscriptions,
  getSubscriptionById,
  cancelSubscription,
  renewSubscription,
};
