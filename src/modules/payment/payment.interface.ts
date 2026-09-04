import { Model, Types } from 'mongoose';

export type TPaymentType = 'first' | 'renewal';
export type TPaymentStatus = 'open' | 'pending' | 'paid' | 'failed' | 'canceled' | 'expired';

export type TPayment = {
  _id: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  mollieId: string;
  type: TPaymentType;
  amount: number;
  currency: string;
  method?: string;
  status: TPaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentModel = Model<TPayment>;
