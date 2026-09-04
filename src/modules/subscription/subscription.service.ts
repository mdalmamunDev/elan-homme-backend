import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Subscription } from './subscription.model';
import { Magazine } from '../magazine/magazine.model';
import { User } from '../user/user.model';
import { Payment } from '../payment/payment.model';
import { SequenceType } from '@mollie/api-client';
import { mollieClient } from '../../helpers/mollie';
import { config } from '../../config';

// Parses a period string like "12 months" / "1 year" into a JS Date offset from `from`.
export const addPeriod = (from: Date, period: string): Date => {
  const match = period.match(/(\d+)\s*(month|year)/i);
  const amount = match ? parseInt(match[1]) : 12;
  const unit = match ? match[2].toLowerCase() : 'month';
  const result = new Date(from);
  if (unit === 'year') result.setFullYear(result.getFullYear() + amount);
  else result.setMonth(result.getMonth() + amount);
  return result;
};

type TCreateSubscriptionInput = {
  magazineId: string;
  orderType: 'self' | 'gift';
  country: string;
  period: string;
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
    description: `${magazine.title} — ${payload.period} subscription`,
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

export const SubscriptionService = {
  createSubscription,
  getMySubscriptions,
  getSubscriptionById,
  cancelSubscription,
  renewSubscription,
};
