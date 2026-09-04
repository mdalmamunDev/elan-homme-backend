import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import Setting from './userSettings.model';
import ISetting, { DefaultValues } from './userSettings.interface';
import { Types } from 'mongoose';
import UserSetting from './userSettings.model';

class Service {
  get = async (key: string, userId: string | Types.ObjectId): Promise<ISetting | null> => {
    if (!key) throw new ApiError(StatusCodes.BAD_REQUEST, 'Key is required');
    
    let setting = await Setting.findOne({ key, userId });
    if (!setting && DefaultValues[key]) {
      setting = await UserSetting.create({key, userId, value: DefaultValues[key]})
    }

    if (!setting) throw new ApiError(StatusCodes.BAD_REQUEST, 'Setting not found');
    
    return setting;
  };

}

export const UserSettingService = new Service();
