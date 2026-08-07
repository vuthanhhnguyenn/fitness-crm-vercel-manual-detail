import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { LessonContentDetailSchema, LessonImageSchema } from './lesson-content-detail.schema';
import {
  LessonBrandSchema,
  LessonContentStatusSchema,
  LessonPricingTypeSchema,
} from './lesson-content.schema';

extendZodWithOpenApi(z);

const LessonKindFormSchema = z.enum(['studio', 'personal', 'bodycare']).openapi({
  title: 'LessonKindForm',
  description: 'Lesson type for form submission',
});

export const CreateLessonContentSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({ example: 'ヨガベーシック' }),
    lesson_type: LessonKindFormSchema.openapi({ example: 'studio' }),
    brand: LessonBrandSchema.openapi({ example: 'joyfit' }),
    duration: z.number().int().openapi({ example: 60 }),
    pricing_type: LessonPricingTypeSchema.openapi({ example: 'included' }),
    per_use_fee: z.number().nullable().optional().openapi({ example: null }),
    images: z
      .array(LessonImageSchema)
      .optional()
      .default([])
      .openapi({ description: 'Gallery images (ordered; order 1 = main image)' }),
    restricted_main_contracts: z.array(z.string()).optional().default([]),
    restricted_option_contracts: z.array(z.string()).optional().default([]),
    description: z.string().max(10000).optional().default(''),
    internal_memo: z.string().max(1000).optional().default(''),
    status: LessonContentStatusSchema.openapi({ example: 'active' }),
  })
  .openapi({
    title: 'CreateLessonContentRequest',
    description: 'Create lesson content master payload',
  });

export const UpdateLessonContentSchema = CreateLessonContentSchema.partial().openapi({
  title: 'UpdateLessonContentRequest',
  description: 'Update lesson content master payload (partial)',
});

export const CreateLessonContentResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'レッスンを登録しました' }),
    data: LessonContentDetailSchema,
  })
  .openapi({
    title: 'CreateLessonContentResponse',
    description: 'Create lesson content response',
  });

export const UpdateLessonContentResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'レッスンの変更を保存しました' }),
    data: LessonContentDetailSchema,
  })
  .openapi({
    title: 'UpdateLessonContentResponse',
    description: 'Update lesson content response',
  });

export type CreateLessonContentRequest = z.infer<typeof CreateLessonContentSchema>;
export type UpdateLessonContentRequest = z.infer<typeof UpdateLessonContentSchema>;
export type CreateLessonContentResponse = z.infer<typeof CreateLessonContentResponseSchema>;
export type UpdateLessonContentResponse = z.infer<typeof UpdateLessonContentResponseSchema>;
