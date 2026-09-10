import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Subscription } from './subscription.model';
import { Magazine } from '../magazine/magazine.model';
import { User } from '../user/user.model';
import { Payment } from '../payment/payment.model';
import { SequenceType } from '@mollie/api-client';
import { mollieClient } from '../../helpers/mollie';
import { config } from '../../config';
import paginate from '../../helpers/paginationHelper';

// Adds `period` months to a date.
export const addPeriod = (from: Date, period: number): Date => {



  const result = new Date(from);
  result.setMonth(result.getMonth() + period);

  return result;
};

type TCreateSubscriptionInput = {
  magazineId: string;
  orderType: 'self' | 'gift';
  country: string;
  period: number;
  recipient?: { name: string; email: string };
};

const createSubscription = async (userId: string, payload: TCreateSubscriptionInput) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const magazine = await Magazine.findById(payload.magazineId);
  if (!magazine || !magazine.isActive) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');

  const countryPricing = magazine.pricing.find(p => p.country === payload.country.toUpperCase());
  if (!countryPricing) throw new ApiError(StatusCodes.BAD_REQUEST, 'This magazine is not available for the selected country');

  if (payload.orderType === 'gift' && !payload.recipient) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Recipient details are required for a gift subscription');
  }

  // Ensure the user has a Mollie customer record — required to create a mandate for renewals.
  if (!user.mollieCustomerId) {
    const customer = await mollieClient.customers.create({ name: user.name, email: user.email });
    user.mollieCustomerId = customer.id;
    await user.save();
  }

  const subscription = await Subscription.create({
    userId: user._id,
    magazineId: magazine._id,
    orderType: payload.orderType,
    payer: { name: user.name, email: user.email },
    recipient: payload.recipient,
    period: payload.period,
    price: countryPricing.price,
    currency: countryPricing.currency,
    country: payload.country.toUpperCase(),
    status: 'pending',
  });

  const molliePayment = await mollieClient.payments.create({
    amount: { currency: mollieCurrencyCode(countryPricing.currency), value: countryPricing.price.toFixed(2) },
    description: `${magazine.title} — ${payload.period} month(s) subscription`,
    redirectUrl: `${config.client.url}/payment-confirmation?subscriptionId=${subscription._id}`,
    webhookUrl: config.mollie.webhookUrl,
    customerId: user.mollieCustomerId,
    sequenceType: SequenceType.first,
    metadata: { subscriptionId: subscription._id.toString() },
  });

  await Payment.create({
    subscriptionId: subscription._id,
    mollieId: molliePayment.id,
    type: 'first',
    amount: countryPricing.price,
    currency: countryPricing.currency,
    status: molliePayment.status,
  });

  return { subscription, checkoutUrl: molliePayment.getCheckoutUrl() };
};

// Mollie expects ISO 4217 currency codes, not symbols — map the small set the frontend uses.
const currencySymbolToCode: Record<string, string> = {
  '£': 'GBP',
  '€': 'EUR',
  $: 'USD',
  A$: 'AUD',
  C$: 'CAD',
};
export const mollieCurrencyCode = (symbol: string) => currencySymbolToCode[symbol] || symbol;

const getMySubscriptions = async (userId: string) => {
  return Subscription.find({ userId }).populate('magazineId').sort({ createdAt: -1 });
};

const getSubscriptionById = async (id: string) => {
  const subscription = await Subscription.findById(id).populate('magazineId');
  if (!subscription) throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const cancelSubscription = async (userId: string, subscriptionId: string) => {
  const subscription = await Subscription.findOne({ _id: subscriptionId, userId });
  if (!subscription) throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
  if (subscription.status === 'cancelled') throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription is already cancelled');

  subscription.autoRenew = false;
  subscription.status = 'cancelled';
  await subscription.save();
  return subscription;
};

// Manual renewal — charges the stored Mollie mandate directly (no redirect needed).
const renewSubscription = async (userId: string, subscriptionId: string) => {
  const subscription = await Subscription.findOne({ _id: subscriptionId, userId });
  if (!subscription) throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
  if (!subscription.mollieMandateId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No payment mandate on file for this subscription');

  const user = await User.findById(userId);
  if (!user?.mollieCustomerId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No Mollie customer on file');

  const molliePayment = await mollieClient.payments.create({
    amount: { currency: mollieCurrencyCode(subscription.currency), value: subscription.price.toFixed(2) },
    description: `Renewal — subscription ${subscription._id}`,
    customerId: user.mollieCustomerId,
    sequenceType: SequenceType.recurring,
    mandateId: subscription.mollieMandateId,
    webhookUrl: config.mollie.webhookUrl,
    metadata: { subscriptionId: subscription._id.toString() },
  });

  await Payment.create({
    subscriptionId: subscription._id,
    mollieId: molliePayment.id,
    type: 'renewal',
    amount: subscription.price,
    currency: subscription.currency,
    status: molliePayment.status,
  });

  return { subscription, paymentId: molliePayment.id };
};

// Admin-only creation — no payment involved (useful for testing / manual grants).
// Creates an ACTIVE subscription immediately, with startDate now and endDate computed from the period.
const adminCreateSubscription = async (payload: {
  userId: string;
  magazineId: string;
  orderType?: 'self' | 'gift';
  country?: string;
  period?: number;
}) => {
  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const magazine = await Magazine.findById(payload.magazineId);
  if (!magazine || !magazine.isActive) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');

  const period = payload.period || 12;
  const countryPricing = payload.country
    ? magazine.pricing.find(p => p.country === payload.country!.toUpperCase())
    : magazine.pricing[0];
  if (!countryPricing) throw new ApiError(StatusCodes.BAD_REQUEST, 'This magazine is not available for the selected country');

  const startDate = new Date();
  const subscription = await Subscription.create({
    userId: user._id,
    magazineId: magazine._id,
    orderType: payload.orderType || 'self',
    payer: { name: user.name, email: user.email },
    period,
    price: countryPricing.price,
    currency: countryPricing.currency,
    country: countryPricing.country,
    status: 'active',
    startDate,
    endDate: addPeriod(startDate, period),
    autoRenew: false,
  });

  return subscription;
};


// Admin — paginated list of all subscriptions with user + magazine info.
const getAllSubscriptions = async (page: number, limit: number) => {
  return paginate({
    page,
    limit,
    filters: {},
    model: Subscription,
    populate: [
      { path: 'userId', select: 'name email role' },
      { path: 'magazineId', select: 'title slug' },
    ],
  } as any);
};

// Admin — activate / deactivate a subscription manually.
// Deactivating sets status 'cancelled' and turns off auto-renew (no mandate deletion needed).
const adminUpdateSubscriptionStatus = async (subscriptionId: string, status: 'active' | 'cancelled') => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');

  if (status === 'active') {
    // Activating a pending/expired/cancelled subscription — start it from now if it has no dates yet.
    subscription.status = 'active';
    if (!subscription.startDate) subscription.startDate = new Date();
    if (!subscription.endDate) subscription.endDate = addPeriod(subscription.startDate, subscription.period || 12);
  } else {
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
  }

  await subscription.save();
  return subscription;
};
export const SubscriptionService = {
  createSubscription,
  adminCreateSubscription,
  getMySubscriptions,
  getSubscriptionById,
  cancelSubscription,
  renewSubscription,
  getAllSubscriptions,
  adminUpdateSubscriptionStatus,
};
