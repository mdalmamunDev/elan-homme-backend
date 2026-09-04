import mongoose, { Schema } from 'mongoose';
import IUserSetting from './userSettings.interface';

const schema = new Schema<IUserSetting>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required.'],
    },
    key: {
      type: String,
      required: [true, 'Key is required']
    },
    name:  String,
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Value is required'],
    },
  },
  {
    // timestamps: true,
  }
);

const UserSetting = mongoose.model<IUserSetting>('UserSetting', schema);
export default UserSetting;
