import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { MagazineService } from './magazine.service';
import { Magazine } from './magazine.model';
import paginate from '../../helpers/paginationHelper';

const createMagazine = catchAsync(async (req, res) => {
  const result = await MagazineService.createMagazine(req.body);
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Magazine created', data: result });
});

const getAllMagazines = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { results, pagination } = await paginate({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    filters: {},
    sortField: 'createdAt',
    sortOrder: 'desc',
    model: Magazine,
  });

  sendResponse(res, { code: StatusCodes.OK, data: results, pagination });
});

const getAllMagazinesWeb = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { results, pagination } = await paginate({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    filters: {
      isActive: true,
    },
    sortField: 'createdAt',
    sortOrder: 'desc',
    model: Magazine,
  });

  sendResponse(res, { code: StatusCodes.OK, data: results, pagination });
});

const getMagazineBySlug = catchAsync(async (req, res) => {
  const result = await MagazineService.getMagazineBySlug(req.params.slug as string);
  sendResponse(res, { code: StatusCodes.OK, data: result });
});

const updateMagazine = catchAsync(async (req, res) => {
  const result = await MagazineService.updateMagazine(req.params.id as string, req.body);
  sendResponse(res, { code: StatusCodes.OK, message: 'Magazine updated', data: result });
});

const deleteMagazine = catchAsync(async (req, res) => {
  await MagazineService.deleteMagazine(req.params.id as string);
  sendResponse(res, { code: StatusCodes.OK, message: 'Magazine deleted' });
});

export const MagazineController = {
  createMagazine,
  getAllMagazines,
  getAllMagazinesWeb,
  getMagazineBySlug,
  updateMagazine,
  deleteMagazine,
};
