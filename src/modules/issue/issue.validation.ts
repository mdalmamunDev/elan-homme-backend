import { z } from 'zod';

const mongoId = z
  .string({ required_error: 'Magazine id is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid magazine id');

// multipart/form-data fields arrive as strings — coerce numeric/boolean fields
const intField = z.preprocess(v => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().int().positive().optional());
const boolField = z.preprocess(v => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional());

const createIssueValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1),
    magazineId: mongoId,
    downloadLimit: intField,
  }),
});

const updateIssueValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    magazineId: mongoId.optional(),
    isActive: boolField,
    downloadLimit: intField,
  }),
});

export const IssueValidation = { createIssueValidationSchema, updateIssueValidationSchema };
