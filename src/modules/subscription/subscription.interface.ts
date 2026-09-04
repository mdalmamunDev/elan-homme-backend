import { Model, Types } from 'mongoose';

export type TOrderType = 'self' | 'gift';
export type TSubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired';

export type TContact = {
  name: string;
  email: string;
};

export type TSubscription = {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // the account that purchased it (payer)
  magazineId: Types.ObjectId;
  orderType: TOrderType;
  payer: TContact;
  recipient?: TContact; // gift orders only
  period: string; // e.g. "12 months"
  price: number;
  currency: string;
  country: string;
  status: TSubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;
  mollieMandateId?: string;
  renewalReminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionModel = Model<TSubscription>;
