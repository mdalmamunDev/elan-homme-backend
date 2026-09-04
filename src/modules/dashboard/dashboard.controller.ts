import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserService } from '../user/user.service';
import { BalanceService } from '../balance/balance.service';
import { getOrSetCache } from '../../shared/cache.service';
import paginate from '../../helpers/paginationHelper';
import { buildCacheKey } from '../../helpers/redisKey.helper';
import { Notification } from '../notification/notification.model';

// get all Tools
class Controller {
  getDashboard = catchAsync(async (req, res) => {
    const { recentLimit = '20', year, month } = req.query;

    const [
      totalUsers,
      totalProvider,
      recentUsers,
      chargeBalance,
      appBalance,
    ] = await Promise.all([
      UserService.getTotalUsers('user'),
      UserService.getTotalUsers('provider'),
      UserService.getRecentUsers(parseInt(recentLimit as string, 10)),
      BalanceService.getChargeBalance(),
      BalanceService.getAppBalance(),
    ]);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        totalUsers,
        totalProvider,
        recentUsers,
        chargeBalance,
        appBalance,
      },
    });
  });

  getEarnings = catchAsync(async (req, res) => {
    const [totalEarnings, appBalance] =
      await Promise.all([
        BalanceService.getChargeBalance(),
        BalanceService.getAppBalance(),
      ]);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        totalEarnings,
        appBalance,
      },
    });
  });


   getALLNotification = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sortField = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const cacheKey = buildCacheKey('notifications', 'admin', {
      page,
      limit,
      sortField,
      sortOrder,
    });
    const { data, cached } = await getOrSetCache(cacheKey, async () => {
      // Call the paginate function with required parameters
      const { results, pagination } = await paginate({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: {
          receiverId: null,
        },
        sortField: sortField as string,
        sortOrder: sortOrder as string,
        model: Notification,
      });

      return { data: results, pagination };
    });

    // Send the response with the results and pagination info
    sendResponse(res, { code: StatusCodes.OK, ...data, cached });
  });
}

const DashboardController = new Controller();
export default DashboardController;
