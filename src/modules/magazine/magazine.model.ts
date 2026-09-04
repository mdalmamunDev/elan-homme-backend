import { model, Schema } from 'mongoose';
import { TMagazine, MagazineModel } from './magazine.interface';

const pricingSchema = new Schema(
  {
    country: { type: String, required: true, uppercase: true },
    currency: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const magazineSchema = new Schema<TMagazine, MagazineModel>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    pricing: { type: [pricingSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Magazine = model<TMagazine, MagazineModel>('Magazine', magazineSchema);
