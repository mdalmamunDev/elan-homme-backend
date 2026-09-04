import { Types } from 'mongoose';

export type INotificationType = 'default' | 'ride' | 'payment' | 'account';
export const NotificationTypes: INotificationType[] = ['default', 'ride', 'payment', 'account'];

export interface INotification {
  _id: Types.ObjectId;
  receiverId?: Types.ObjectId | string;
  title: string;
  message: string;
  type: INotificationType
  viewStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
}
