import { z } from 'zod';

const pricingSchema = z.object({
  country: z.string().min(2),
  currency: z.string().min(1),
  price: z.number().positive(),
});

const createMagazineValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1),
    slug: z.string({ required_error: 'Slug is required' }).min(1),
    description: z.string().optional(),
    pricing: z.array(pricingSchema).min(1, 'At least one country price is required'),
  }),
});

const updateMagazineValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    pricing: z.array(pricingSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const MagazineValidation = { createMagazineValidationSchema, updateMagazineValidationSchema };
