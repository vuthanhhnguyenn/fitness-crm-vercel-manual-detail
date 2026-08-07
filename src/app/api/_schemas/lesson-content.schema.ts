import { PAGE_SIZE } from '@/constants/app.constants';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * D-02 FR-001 — Lesson Content Master list/search schemas.
 * Mock source of truth for `/api/crm/lesson-contents` and `/api/crm/personal-plans`.
 * Field names use snake_case to match existing mock/query conventions (`crm/members`).
 */

/** Reusable preprocessor: accept comma-separated or repeated query params as arrays. */
function arrayQuery<T extends z.ZodTypeAny>(itemSchema: T, description: string) {
  return z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [val];
  }, z.array(itemSchema).optional().openapi({ description }));
}

function booleanQuery(description: string) {
  return z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional().openapi({ description }));
}

// ─── Enums ────────────────────────────────────────────────────────────────

export const LessonBrandSchema = z.enum(['joyfit', 'fit365']).openapi({
  title: 'LessonBrand',
  description: 'Lesson content brand',
});

export const LessonContentStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'LessonContentStatus',
  description: 'Lesson content status',
});

export const LessonPricingTypeSchema = z.enum(['included', 'paid']).openapi({
  title: 'LessonPricingType',
  description: 'Studio/body-care pricing type',
});

export const LessonGenderRestrictionSchema = z.enum(['none', 'male', 'female']).openapi({
  title: 'LessonGenderRestriction',
  description: 'Gender restriction',
});

export const LessonKindSchema = z.enum(['studio', 'bodycare']).openapi({
  title: 'LessonKind',
  description: 'Which lesson set (Studio vs Body care tab)',
});

// ─── Items ──────────────────────────────────────────────────────────────────

export const LessonContentItemSchema = z
  .object({
    id: z.string().openapi({ example: 'LSN-0001', description: 'Lesson master ID' }),
    name: z.string().openapi({ example: 'ヨガベーシック', description: 'Lesson name' }),
    kind: LessonKindSchema.openapi({ example: 'studio' }),
    brand: LessonBrandSchema.openapi({ example: 'joyfit' }),
    duration: z.number().int().openapi({ example: 60, description: 'Duration in minutes' }),
    pricing_type: LessonPricingTypeSchema.openapi({ example: 'included' }),
    status: LessonContentStatusSchema.openapi({ example: 'active' }),
    gender_restriction: LessonGenderRestrictionSchema.openapi({ example: 'none' }),
    lesson_category: z.string().openapi({ example: 'スタジオレッスン' }),
    category: z.string().openapi({ example: 'ヨガ' }),
    store_id: z.string().openapi({ example: 'store-001' }),
    is_deleted: z.boolean().openapi({ example: false }),
    reservation_count: z.number().int().optional().openapi({ example: 12 }),
    max_reservation_count: z.number().int().optional().openapi({ example: 20 }),
  })
  .openapi({
    title: 'LessonContentItem',
    description: 'Studio / body care lesson master row',
  });

export const PersonalPlanItemSchema = z
  .object({
    id: z.string().openapi({ example: 'PLN-0001', description: 'Plan ID' }),
    name: z.string().openapi({ example: 'パーソナル60', description: 'Plan name' }),
    description: z.string().optional().openapi({ example: '60分のマンツーマン指導' }),
    category: z.string().openapi({ example: 'ダイエット' }),
    duration: z.number().int().openapi({ example: 60, description: 'Duration in minutes' }),
    price: z.number().int().openapi({ example: 8000, description: 'Price in yen' }),
    reservations: z.number().int().openapi({ example: 5 }),
    max_reservations: z.number().int().openapi({ example: 10 }),
    brand: LessonBrandSchema.openapi({ example: 'fit365' }),
    status: LessonContentStatusSchema.openapi({ example: 'active' }),
    store_id: z.string().openapi({ example: 'store-001' }),
    is_deleted: z.boolean().openapi({ example: false }),
  })
  .openapi({
    title: 'PersonalPlanItem',
    description: 'Personal training plan row',
  });

// ─── Pagination ───────────────────────────────────────────────────────────

export const LessonPaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: PAGE_SIZE }),
    total: z.number().int().openapi({ example: 37 }),
    total_pages: z.number().int().openapi({ example: 2 }),
  })
  .openapi({ title: 'LessonPagination', description: 'Pagination information' });

// ─── Queries ──────────────────────────────────────────────────────────────

export const GetLessonContentsQuerySchema = z
  .object({
    kind: LessonKindSchema.optional().default('studio'),
    page: z.coerce.number().int().positive().optional().default(1).openapi({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .default(PAGE_SIZE)
      .openapi({ example: PAGE_SIZE, description: 'Items per page (max 50)' }),
    search: z
      .string()
      .optional()
      .openapi({ example: 'ヨガ', description: 'Partial match on name or id' }),
    lesson_category: arrayQuery(z.string(), 'Filter by lesson category'),
    category: arrayQuery(z.string(), 'Filter by category'),
    brand: arrayQuery(LessonBrandSchema, 'Filter by brand'),
    status: arrayQuery(LessonContentStatusSchema, 'Filter by status'),
    include_deleted: booleanQuery('Include inactive / deleted rows'),
    store_id: z.string().optional().openapi({ example: 'store-001' }),
    sort_by: z.enum(['id', 'name', 'duration', 'status', 'brand']).optional().default('id'),
    sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .openapi({
    title: 'GetLessonContentsQuery',
    description: 'Query parameters for lesson contents list',
  });

export const GetLessonContentsResponseSchema = z
  .object({
    data: z.array(LessonContentItemSchema).openapi({ description: 'Lesson content rows' }),
    pagination: LessonPaginationSchema,
  })
  .openapi({
    title: 'GetLessonContentsResponse',
    description: 'Response for lesson contents list',
  });

export const GetPersonalPlansQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1).openapi({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .default(PAGE_SIZE)
      .openapi({ example: PAGE_SIZE, description: 'Items per page (max 50)' }),
    search: z
      .string()
      .optional()
      .openapi({ example: 'パーソナル', description: 'Partial match on name or id' }),
    category: arrayQuery(z.string(), 'Filter by plan category'),
    brand: arrayQuery(LessonBrandSchema, 'Filter by brand'),
    status: arrayQuery(LessonContentStatusSchema, 'Filter by status'),
    include_deleted: booleanQuery('Include inactive / deleted rows'),
    store_id: z.string().optional().openapi({ example: 'store-001' }),
    sort_by: z.enum(['id', 'name', 'category', 'duration', 'price']).optional().default('id'),
    sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .openapi({
    title: 'GetPersonalPlansQuery',
    description: 'Query parameters for personal plans list',
  });

export const GetPersonalPlansResponseSchema = z
  .object({
    data: z.array(PersonalPlanItemSchema).openapi({ description: 'Personal plan rows' }),
    pagination: LessonPaginationSchema,
  })
  .openapi({
    title: 'GetPersonalPlansResponse',
    description: 'Response for personal plans list',
  });

// ─── Type exports ────────────────────────────────────────────────────────

export type LessonBrand = z.infer<typeof LessonBrandSchema>;
export type LessonContentStatus = z.infer<typeof LessonContentStatusSchema>;
export type LessonPricingType = z.infer<typeof LessonPricingTypeSchema>;
export type LessonGenderRestriction = z.infer<typeof LessonGenderRestrictionSchema>;
export type LessonKind = z.infer<typeof LessonKindSchema>;
export type LessonContentItem = z.infer<typeof LessonContentItemSchema>;
export type PersonalPlanItem = z.infer<typeof PersonalPlanItemSchema>;
export type LessonPagination = z.infer<typeof LessonPaginationSchema>;
export type GetLessonContentsQuery = z.infer<typeof GetLessonContentsQuerySchema>;
export type GetLessonContentsResponse = z.infer<typeof GetLessonContentsResponseSchema>;
export type GetPersonalPlansQuery = z.infer<typeof GetPersonalPlansQuerySchema>;
export type GetPersonalPlansResponse = z.infer<typeof GetPersonalPlansResponseSchema>;
