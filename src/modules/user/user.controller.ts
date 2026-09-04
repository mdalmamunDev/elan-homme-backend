import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import { UserService } from './user.service';
import { User } from './user.model';
import paginate from '../../helpers/paginationHelper';
import { Role, UserRole } from './user.constant';
import { Types } from 'mongoose';
import { escapeRegex, toInt, toSortOrder } from '../../utils';


// Get all users with pagination and filters

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'name',
  'email',
  'status',
  'role',
]);

const USER_SELECT =
  'name email address phone dateOfBirth role profileImage createdAt status isEmailVerified';


const getAllUsers = catchAsync(async (req, res) => {
  const {
    role,
    keyword,
    filter = 'all',
  } = req.query;

  const page = toInt(req.query.page, 1);
  const limit = toInt(req.query.limit, 10);
  const sortOrder = toSortOrder(req.query.sortOrder);

  const sortField =
    typeof req.query.sortField === 'string' &&
    ALLOWED_SORT_FIELDS.has(req.query.sortField)
      ? req.query.sortField
      : 'createdAt';

  // ── Validate role ────────────────────────────────────────────────
  if (role && !UserRole.includes(role as Role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Role not valid.');
  }

  // ── Build base filters (applies to ALL roles) ──────────────────
  const filters: Record<string, any> = { isDeleted: false };

  if (role) filters.role = role;
  if (filter !== 'all') filters.status = filter;

  // ── Keyword search (applies to ALL roles) ──────────────────────
  if (keyword && typeof keyword === 'string' && keyword.trim()) {
    const trimmed = keyword.trim();
    const escaped = escapeRegex(trimmed);
    filters.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: trimmed.toLowerCase() },
      { phone: trimmed },
      ...(Types.ObjectId.isValid(trimmed)
        ? [{ _id: new Types.ObjectId(trimmed) }]
        : []),
    ];
  }


  // ── Paginate ───────────────────────────────────────────────────
  const { results, pagination } = await paginate({
    page,
    limit,
    filters,
    sortField,
    sortOrder,
    model: User,
    select: USER_SELECT,
    lean: true,
  });

  if (results.length === 0) {
    return sendResponse(res, {
      code: StatusCodes.OK,
      message: 'Users retrieved successfully',
      data: [],
      pagination,
    });
  }

  return sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Users retrieved successfully',
    data: results,
    pagination,
  });
});




//get single user from database
const getSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserService.getSingleUser(userId as string);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
  });
});


//update user status from database
const updateUserStatusOrRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { status, role } = req.body;
  const result = await UserService.updateUserStatus(userId as string, { status, role });
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User status or role updated successfully',
  });
});

//update user
const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  payload.status = undefined; // remove status from body if it exists
  payload.role = undefined; // remove role from body if it exists
  payload.location = undefined; // remove location from body if it exists
  const result = await UserService.updateUserProfile(userId as string, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//update user
const updateMyLocation = catchAsync(async (req, res) => {
  const { lng, lat } = req.body;

  if (!lng || !lat) {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Latitude and Longitude are required',
    });
  }

  const result = await UserService.updateUserProfile(req.user.userId, {
    location: {
      type: 'Point', // GeoJSON type
      coordinates: [lng, lat], // [longitude, latitude]
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result.location?.coordinates,
    message: 'My location updated successfully',
  });
});


//delete user from database
const deleteUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.deleteUserProfile(userId as string);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User deleted successfully',
  });
});

export const UserController = {
  getAllUsers,
  getSingleUser,
  updateUserStatusOrRole,
  updateMyLocation,
  updateUserProfile,
  deleteUserProfile,
};
