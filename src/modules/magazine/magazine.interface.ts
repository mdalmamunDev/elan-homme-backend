import { Model, Types } from 'mongoose';

export type TPricing = {
  country: string; // ISO country code, e.g. "GB", "US"
  currency: string; // symbol, e.g. "£", "$"
  price: number;
};

export type TMagazine = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  pricing: TPricing[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MagazineModel = Model<TMagazine>;
