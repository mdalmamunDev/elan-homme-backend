import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { SettingsRoutes } from '../modules/settings/settings.routes';
import { UploadRoutes } from '../modules/upload/upload.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { DashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { BalanceRoutes } from '../modules/balance/balance.routes';
import { UserSettingsRoutes } from '../modules/userSettings/UserSettings.routes';
const router = express.Router();

const apiRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  // {
  //   path: '/user',
  //   route: UserRoutes,
  // },
  // {
  //   path: '/setting',
  //   route: SettingsRoutes,
  // },
  // {
  //   path: '/user-setting',
  //   route: UserSettingsRoutes,
  // },
  // {
  //   path: '/upload',
  //   route: UploadRoutes,
  // },
  // {
  //   path: '/notification',
  //   route: NotificationRoutes
  // },
  // {
  //   path: '/payment',
  //   route: PaymentRoutes
  // },
  // {
  //   path: '/dashboard',
  //   route: DashboardRoutes
  // },
  // {
  //   path: '/balance',
  //   route: BalanceRoutes
  // },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
