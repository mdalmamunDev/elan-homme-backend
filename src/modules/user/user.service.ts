import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { TUser } from './user.interface';
import { User } from './user.model';
import { Role, TUserStatus } from './user.constant';
import { ObjectId, Types } from 'mongoose';
import colors from 'colors';
import { logger } from '../../shared/logger';
import moment from 'moment';

const getAllUsers = async (
  filters: Record<string, any>,
  options: PaginateOptions
): Promise<PaginateResult<TUser>> => {
  const query: Record<string, any> = {};
  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }
  return await User.paginate(query, options);
};

const getRecentUsers = async (limit: number) => {
  const users = await User.find({ isDeleted: false, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name email address createdAt');

  const updatedUsers = users.map((user: any) => ({
    ...user.toObject(),
    ago: moment(user.createdAt).fromNow(),
  }));
  return updatedUsers;
};

const getSingleUser = async (userId: string): Promise<TUser | null> => {
  const result: any = await User.findById(userId).select('-wallet').lean();
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if (result.isDeleted) throw new ApiError(StatusCodes.NOT_FOUND, 'User deleted');
  return result;
};

const updateUserStatus = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-wallet');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};
const updateUserProfile = async (
  userId: string,
  payload: any
): Promise<any> => {
  const result = await User.findByIdAndUpdate(userId, payload, {
    new: true,
  }).select('-wallet').lean();

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return result;
};
const updateUser = async (userId: string, payload: Partial<TUser>): Promise<TUser | null> => {
  const existingUser = await User.findById(userId).lean();
  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (!payload.step || (payload.step <= (existingUser.step || 0))) {
    payload.step = undefined;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-wallet').lean();
  if (!updatedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return updatedUser;
};

const deleteUserProfile = async (userId: string): Promise<TUser | null> => {
  // const result = await User.findById(userId).select('-wallet');
  // if (!result) {
  //   throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  // }
  // result.isDeleted = true;
  // await result.save();

  const result = await User.findByIdAndDelete(userId);
  return result;
};


const getTotalUsers = async (role: Role) => {
  const total = await User.countDocuments({ isDeleted: false, status: 'active' as TUserStatus, role })
  return total;
}


export const UserService = {
  getAllUsers,
  getRecentUsers,
  getSingleUser,
  updateUserStatus,
  updateUserProfile,
  updateUser,
  deleteUserProfile,
  getTotalUsers,
};
