import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { MagazineController } from './magazine.controller';
import { MagazineValidation } from './magazine.validation';

const router = Router();

// public
router.get('/web', MagazineController.getAllMagazinesWeb);
router.get('/:slug', MagazineController.getMagazineBySlug);

// admin
router.get('/', auth('admin'), MagazineController.getAllMagazines);
router.post(
  '/',
  auth('admin'),
  validateRequest(MagazineValidation.createMagazineValidationSchema),
  MagazineController.createMagazine
);
router.put(
  '/:id',
  auth('admin'),
  validateRequest(MagazineValidation.updateMagazineValidationSchema),
  MagazineController.updateMagazine
);
router.delete('/:id', auth('admin'), MagazineController.deleteMagazine);

export const MagazineRoutes = router;
