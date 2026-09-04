import { z } from 'zod';

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    magazineId: z.string({ required_error: 'magazineId is required' }),
    orderType: z.enum(['self', 'gift']),
    country: z.string({ required_error: 'country is required' }).min(2),
    period: z.string().default('12 months'),
    recipient: z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
      })
      .optional(),
  }),
});

export const SubscriptionValidation = { createSubscriptionValidationSchema };
