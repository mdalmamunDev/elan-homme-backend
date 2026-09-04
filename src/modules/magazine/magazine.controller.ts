import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { MagazineService } from './magazine.service';

const createMagazine = catchAsync(async (req, res) => {
  const coverImage = req.file ? `/uploads/covers/${req.file.filename}` : undefined;
  const result = await MagazineService.createMagazine(req.body, coverImage);
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Magazine created', data: result });
});

const getAllMagazines = catchAsync(async (req, res) => {
  const result = await MagazineService.getAllMagazines();
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const getMagazineBySlug = catchAsync(async (req, res) => {
  const result = await MagazineService.getMagazineBySlug(req.params.slug as string);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const updateMagazine = catchAsync(async (req, res) => {
  const coverImage = req.file ? `/uploads/covers/${req.file.filename}` : undefined;
  const result = await MagazineService.updateMagazine(req.params.id as string, req.body, coverImage);
  sendResponse(res, { code: StatusCodes.OK, message: 'Magazine updated', data: result });
});

const deleteMagazine = catchAsync(async (req, res) => {
  await MagazineService.deleteMagazine(req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, message: 'Magazine deleted' });
});

export const MagazineController = {
  createMagazine,
  getAllMagazines,
  getMagazineBySlug,
  updateMagazine,
  deleteMagazine,
};
