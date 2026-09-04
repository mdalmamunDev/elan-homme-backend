import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.services';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import paginate from '../../helpers/paginationHelper';
import { Notification } from './notification.model';
import { buildCacheKey } from '../../helpers/redisKey.helper';
import ApiError from '../../errors/ApiError';
import { getOrSetCache } from '../../shared/cache.service';

const getALLNotification = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', } = req.query;
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access');

  const cacheKey = buildCacheKey('notifications', userId, { page, limit, sortField, sortOrder });
  const { data, cached } = await getOrSetCache(cacheKey, async () => {
    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters: { receiverId: userId },
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Notification,
    });

    return { data: results, pagination };
  });


  // Send the response with the results and pagination info
  sendResponse(res, { code: StatusCodes.OK, ...data, cached, });

  await NotificationService.makeNotificationsSeen(userId);
});

const getUnseenNotificationCount = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const data = await NotificationService.getUnseenNotificationCount(userId);

  sendResponse(res, { code: StatusCodes.OK, data: data, });
});

export const NotificationController = {
  getALLNotification,
  getUnseenNotificationCount,
};
