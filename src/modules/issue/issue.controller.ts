import { StatusCodes } from 'http-status-codes';
import path from 'path';
import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { IssueService } from './issue.service';
import ApiError from '../../errors/ApiError';

const createIssue = catchAsync(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(StatusCodes.BAD_REQUEST, 'Issue PDF file is required');

  const result = await IssueService.createIssue({
    title: req.body.title,
    magazineId: req.body.magazineId,
    filePath: file.filename,
    fileSize: file.size,
    downloadLimit: req.body.downloadLimit ? parseInt(req.body.downloadLimit, 10) : undefined,
  });

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Issue uploaded', data: result });
});

const getIssues = catchAsync(async (req, res) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const { results, pagination } = await IssueService.getIssues(page, limit);
  sendResponse(res, { code: StatusCodes.OK, data: results, pagination });
});

const getIssuesByMagazine = catchAsync(async (req, res) => {
  const result = await IssueService.getIssuesByMagazine(req.params.magazineId as string);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const getIssueById = catchAsync(async (req, res) => {
  const result = await IssueService.getIssueById(req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const updateIssue = catchAsync(async (req, res) => {
  // multipart/form-data fields arrive as strings — normalize before saving
  const payload: any = { ...req.body };
  if (payload.downloadLimit !== undefined) payload.downloadLimit = parseInt(payload.downloadLimit, 10);
  if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' || payload.isActive === true;

  const result = await IssueService.updateIssue(req.params.id as string, payload, req.file);
  sendResponse(res, { code: StatusCodes.OK, message: 'Issue updated', data: result });
});

const deleteIssue = catchAsync(async (req, res) => {
  await IssueService.deleteIssue(req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, message: 'Issue deleted' });
});

const downloadIssue = catchAsync(async (req: Request, res: Response) => {
  const { filePath } = await IssueService.downloadIssue(req.user.userId, req.params.id as string);
  const absolutePath = path.join(process.cwd(), 'uploads', filePath);
  res.download(absolutePath);
});

export const IssueController = {
  createIssue,
  getIssues,
  getIssuesByMagazine,
  getIssueById,
  updateIssue,
  deleteIssue,
  downloadIssue,
};
