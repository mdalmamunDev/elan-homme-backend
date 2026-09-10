import { z } from 'zod';

// period is an integer number of months (e.g. 12). Coerce in case it arrives as a string.
const periodMonths = z.preprocess(
  v => (v === undefined || v === null ? v : typeof v === 'string' ? parseInt(v, 10) : v),
  z.number({ invalid_type_error: 'period must be a number of months' }).int().positive().default(12)
);

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    magazineId: z.string({ required_error: 'magazineId is required' }),
    orderType: z.enum(['self', 'gift']),
    country: z.string({ required_error: 'country is required' }).min(2),
    period: periodMonths,
    recipient: z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
      })
      .optional(),
  }),
});

// admin-only creation (testing / manual grants) — no payment involved
const adminCreateSubscriptionValidationSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid userId'),
    magazineId: z.string({ required_error: 'magazineId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid magazineId'),
    orderType: z.enum(['self', 'gift']).default('self'),
    country: z.string().min(2).optional(), // optional — falls back to the magazine's first pricing entry
    period: periodMonths,
  }),
});

// admin — force a subscription's status (activate / deactivate) // deactivating turns off auto-renew
const adminUpdateSubscriptionStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'cancelled'], { required_error: 'status is required' }),
  }),
});

export const SubscriptionValidation = {
  createSubscriptionValidationSchema,
  adminCreateSubscriptionValidationSchema,
  adminUpdateSubscriptionStatusValidationSchema,
};
