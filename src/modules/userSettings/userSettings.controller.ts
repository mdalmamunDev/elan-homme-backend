
// update or create a setting
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserSettingService } from './userSettings.service';
import UserSetting from './userSettings.model';
import { getAddressFromCoordinates } from '../../helpers/globalHelper';
import ApiError from '../../errors/ApiError';


// create or update a setting by key
const createOrUpdate = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'User is required', });

  const { key } = req.params;
  if (!key) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Key parameter is required', });

  const setting = await UserSetting.findOneAndUpdate({ key, userId }, req.body, { new: true, upsert: true });
  sendResponse(res, { code: StatusCodes.OK, message: 'Setting updated successfully', data: setting });
});

// get a setting by key
const getSetting = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'User is required', });

  const { key } = req.params;
  if (!key) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Key parameter is required', });

  const setting = await UserSettingService.get(key as string, userId);
  sendResponse(res, { code: StatusCodes.OK, data: setting });
});

// get a setting by key
const readySavedPlaces = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'User is required', });

  const setting = await UserSettingService.get('saved-places', userId);

  const readySettings = await Promise.all(
    setting?.value.map(async (coordinates: [number, number]) => ({
      coordinates,
      address: await getAddressFromCoordinates(coordinates),
    }))
  );

  sendResponse(res, { code: StatusCodes.OK, data: { ready: readySettings, setting } });
});

// get a setting by key
const addSavedPlace = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'User is required', });

  const { coordinates } = req.body;
  if (!coordinates) throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide coordinates');

  const old = await UserSetting.findOne({ key: 'saved-places', userId });
  if(old?.value?.length > 20) throw new ApiError(StatusCodes.BAD_REQUEST, "You can't add more than 20 places")

  const setting = await UserSetting.findOneAndUpdate(
    { key: 'saved-places', userId },
    {
      $addToSet: { value: coordinates },
      $setOnInsert: { key: 'saved-places', userId }
    },
    {
      new: true,
      upsert: true
    }
  );


  sendResponse(res, { code: StatusCodes.OK, data: setting });
});

const removeSavedPlace = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user || {};
  if (!userId) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'User is required', });

  const { coordinates } = req.body;
  if (!coordinates) throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide coordinates');

  const setting = await UserSetting.findOneAndUpdate(
    { key: 'saved-places', userId },
    {
      $pull: { value: coordinates }
    },
    { new: true }
  );

  sendResponse(res, { code: StatusCodes.OK, data: setting, message: 'Your place has been removed.' });
});




export const UserSettingController = {
  getSetting,
  createOrUpdate,
  readySavedPlaces,
  addSavedPlace,
  removeSavedPlace,
};
