import { model, Schema } from 'mongoose';
import { TPayment, PaymentModel } from './payment.interface';

const paymentSchema = new Schema<TPayment, PaymentModel>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    mollieId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['first', 'renewal'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    method: { type: String },
    status: {
      type: String,
      enum: ['open', 'pending', 'paid', 'failed', 'canceled', 'expired'],
      default: 'open',
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = model<TPayment, PaymentModel>('Payment', paymentSchema);
