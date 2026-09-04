import { model, Schema } from 'mongoose';
import { INotification, NotificationTypes } from './notification.interface';

const notificationModel = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'User is required'],
    },
    type: {
      type: String,
      enum: NotificationTypes,
      default: 'default',
    },
    viewStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', notificationModel);
