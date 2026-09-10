import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import createUploadMiddleware from '../../middlewares/upload';
import { IssueController } from './issue.controller';
import { IssueValidation } from './issue.validation';

const router = Router();
const uploadIssuePdf = createUploadMiddleware(50, ['.pdf']);

// user — list active issues of a magazine (registered before /:id routes to avoid param collisions)
router.get('/magazine/:magazineId', auth('common'), IssueController.getIssuesByMagazine);

// user — download (subscription + download-limit enforced in the service)
router.get('/:id/download', auth('common'), IssueController.downloadIssue);

// admin
router.post('/', auth('admin'), uploadIssuePdf.single('file'), validateRequest(IssueValidation.createIssueValidationSchema), IssueController.createIssue);
router.get('/', auth('admin'), IssueController.getIssues);
router.get('/:id', auth('admin'), IssueController.getIssueById);
router.put(
  '/:id',
  auth('admin'),
  uploadIssuePdf.single('file'),
  validateRequest(IssueValidation.updateIssueValidationSchema),
  IssueController.updateIssue
);
router.delete('/:id', auth('admin'), IssueController.deleteIssue);

export const IssueRoutes = router;
