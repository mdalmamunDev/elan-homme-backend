import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Magazine } from './magazine.model';
import paginate from '../../helpers/paginationHelper';

const createMagazine = async (payload: any) => {
  const existing = await Magazine.findOne({ slug: payload.slug });
  if (existing) throw new ApiError(StatusCodes.CONFLICT, 'A magazine with this slug already exists');
  return Magazine.create(payload);
};

const getMagazineBySlug = async (slug: string) => {
  const magazine = await Magazine.findOne({ slug, isActive: true });
  if (!magazine) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');
  return magazine;
};

const getMagazineById = async (id: string) => {
  const magazine = await Magazine.findById(id);
  if (!magazine) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');
  return magazine;
};

const updateMagazine = async (id: string, payload: any) => {
  const magazine = await getMagazineById(id);
  Object.assign(magazine, payload);
  await magazine.save();
  return magazine;
};

const deleteMagazine = async (id: string) => {
  const magazine = await getMagazineById(id);
  magazine.isActive = false;
  await magazine.save();
};

export const MagazineService = {
  createMagazine,
  getMagazineBySlug,
  getMagazineById,
  updateMagazine,
  deleteMagazine,
};
