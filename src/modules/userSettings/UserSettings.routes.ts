import { Router } from 'express';
import auth from '../../middlewares/auth';
import { UserSettingController } from './userSettings.controller';

const router = Router();

router.get('/ready/saved-places', auth('common'), UserSettingController.readySavedPlaces);
router.put('/add-saved-place', auth('common'), UserSettingController.addSavedPlace);
router.delete('/remove-saved-place', auth('common'), UserSettingController.removeSavedPlace);
router.get('/:key', auth('common'), UserSettingController.getSetting);
router.post('/:key', auth('common'), UserSettingController.createOrUpdate);

export const UserSettingsRoutes = router;
