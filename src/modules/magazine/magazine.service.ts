import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Magazine } from './magazine.model';

const createMagazine = async (payload: any, coverImage?: string) => {
  const existing = await Magazine.findOne({ slug: payload.slug });
  if (existing) throw new ApiError(StatusCodes.CONFLICT, 'A magazine with this slug already exists');
  return Magazine.create({ ...payload, coverImage: coverImage || '' });
};

const getAllMagazines = async () => Magazine.find({ isActive: true }).sort({ createdAt: -1 });

const getMagazineBySlug = async (slug: string) => {
  const magazine = await Magazine.findOne({ slug });
  if (!magazine) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');
  return magazine;
};

const getMagazineById = async (id: string) => {
  const magazine = await Magazine.findById(id);
  if (!magazine) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');
  return magazine;
};

const updateMagazine = async (id: string, payload: any, coverImage?: string) => {
  const magazine = await getMagazineById(id);
  Object.assign(magazine, payload);
  if (coverImage) magazine.coverImage = coverImage;
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
  getAllMagazines,
  getMagazineBySlug,
  getMagazineById,
  updateMagazine,
  deleteMagazine,
};
