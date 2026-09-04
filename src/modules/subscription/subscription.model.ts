import { model, Schema } from 'mongoose';
import { TSubscription, SubscriptionModel } from './subscription.interface';

const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<TSubscription, SubscriptionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    magazineId: { type: Schema.Types.ObjectId, ref: 'Magazine', required: true },
    orderType: { type: String, enum: ['self', 'gift'], required: true },
    payer: { type: contactSchema, required: true },
    recipient: { type: contactSchema },
    period: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    country: { type: String, required: true, uppercase: true },
    status: { type: String, enum: ['pending', 'active', 'cancelled', 'expired'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: true },
    mollieMandateId: { type: String },
    renewalReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Subscription = model<TSubscription, SubscriptionModel>('Subscription', subscriptionSchema);
