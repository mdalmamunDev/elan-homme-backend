import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserService } from '../user/user.service';
import { BalanceService } from '../balance/balance.service';
import { getOrSetCache } from '../../shared/cache.service';
import paginate from '../../helpers/paginationHelper';
import { buildCacheKey } from '../../helpers/redisKey.helper';
import { Notification } from '../notification/notification.model';
import { Magazine } from '../magazine/magazine.model';
import { Issue } from '../issue/issue.model';
import { Payment } from '../payment/payment.model';

// get all Tools
class Controller {
  getDashboard = catchAsync(async (req, res) => {
    const { recentLimit = '20', year, month } = req.query;

    // Earnings — sum of PAID payments (paidAt) for the selected year (defaults to current year)
    const selectedYear = parseInt((year as string) || `${new Date().getFullYear()}`, 10);
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1));
    const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1));

    const [totalUsers, totalMagazines, totalIssues, earnings, totalProvider, recentUsers, chargeBalance, appBalance] =
      await Promise.all([
        UserService.getTotalUsers('user'),
        Magazine.countDocuments({}),
        Issue.countDocuments({}),
        Payment.aggregate([
          {
            $match: {
              status: 'paid',
              paidAt: { $gte: yearStart, $lt: yearEnd },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]).then((rows) => rows[0]?.total || 0),
        UserService.getTotalUsers('provider'),
        UserService.getRecentUsers(parseInt(recentLimit as string, 10)),
        BalanceService.getChargeBalance(),
        BalanceService.getAppBalance(),
      ]);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        totalUsers,
        totalMagazines,
        totalIssues,
        earnings,
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
