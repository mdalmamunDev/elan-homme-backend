import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { Role, TGeoLocation, TUserStatus } from './user.constant';

export type TUser = {
  _id: Types.ObjectId;
  mollieCustomerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  location: TGeoLocation | null;
  profileImage: string;
  wallet: number;
  role: Role;
  password: string;
  status: TUserStatus;
  isEmailVerified: boolean;
  isResetPassword: boolean;
  isDeleted: boolean;
  lastPasswordChange: Date;
  failedLoginAttempts: number;
  lockUntil: Date | undefined;
  step: number,
  avgRating: number,
  totalRating: number,
  createdAt: Date;
  updatedAt: Date;
};

export interface UserModal extends Model<TUser> {
  paginate: (
    filter: object,
    options: PaginateOptions
  ) => Promise<PaginateResult<TUser>>;
  isExistUserById(id: string): Promise<Partial<TUser> | null>;
  isExistUserByEmail(email: string): Promise<Partial<TUser> | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
}
