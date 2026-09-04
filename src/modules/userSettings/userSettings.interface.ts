import { Types } from 'mongoose';

export const DefaultValues: Record<string, any> = {
  'saved-places': [],
};

interface IUserSetting {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  name?: string;
  value: any;
}

export default IUserSetting;
