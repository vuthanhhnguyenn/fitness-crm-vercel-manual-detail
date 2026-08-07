import { z } from 'zod';

import {
  BRAND_OPTIONS,
  INCLUDE_DELETED_VALUES,
  TERMS_ORDER_OPTIONS,
  TERMS_SORT_OPTIONS,
  TERMS_STATUS_OPTIONS,
  TERMS_TYPE_OPTIONS,
} from '../_constants/constants';

export const TermsBrandSchema = z.enum(BRAND_OPTIONS);
export const TermsTypeSchema = z.enum(TERMS_TYPE_OPTIONS);
export const TermsStatusSchema = z.enum(TERMS_STATUS_OPTIONS);
export const TermsSortSchema = z.enum(TERMS_SORT_OPTIONS);
export const TermsOrderSchema = z.enum(TERMS_ORDER_OPTIONS);
export const IncludeDeletedSchema = z.enum(INCLUDE_DELETED_VALUES);

export const TermsListFiltersSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  sort: TermsSortSchema,
  order: TermsOrderSchema,
  search: z.string(),
  status: TermsStatusSchema.nullable(),
  termsType: TermsTypeSchema.nullable(),
  brandEnum: TermsBrandSchema.nullable(),
  includeDeleted: IncludeDeletedSchema,
});

export const TermsListApiQuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  sort: TermsSortSchema,
  order: TermsOrderSchema,
  search: z.string().trim().max(100).optional(),
  status: TermsStatusSchema.optional(),
  termsType: TermsTypeSchema.optional(),
  brandEnum: TermsBrandSchema.optional(),
  includeDeleted: z.boolean(),
});

export type TermsFiltersState = z.infer<typeof TermsListFiltersSchema>;
export type IncludeDeleted = z.infer<typeof IncludeDeletedSchema>;
export type TermsListApiQuery = z.infer<typeof TermsListApiQuerySchema>;
