import { Router } from 'express';
import auth from '../../middlewares/auth';
import DashboardController from './dashboard.controller';

const router = Router();
router.get('/', auth('admin'), DashboardController.getDashboard);
router.get('/earnings', auth('admin'), DashboardController.getEarnings);
router.get(
  '/notifications',
  auth('admin'),
  DashboardController.getALLNotification,
);

export const DashboardRoutes = router;
