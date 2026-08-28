import {
  TEXTAREA_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@/constants/app.constants';
import { z } from 'zod';

export const LessonImageItemSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  url: z.string(),
});

export type LessonImageItem = z.infer<typeof LessonImageItemSchema>;

type ApiLessonImage = {
  order: number;
  url: string;
};

/**
 * Maps API gallery images to the form's image items, sorted by API `order`
 * so the main image (order === 1) stays first.
 */
export function detailImagesToFormImages(
  images: ApiLessonImage[] | undefined | null,
): LessonImageItem[] {
  return [...(images ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((image, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      url: image.url,
    }));
}

export const LessonFormSchema = z
  .object({
    name: z.string().max(TEXT_MAX_LENGTH).default(''),
    lessonType: z.enum(['studio', 'personal', 'bodycare']).default('studio'),
    brand: z.enum(['joyfit', 'fit365']).optional(),
    duration: z.coerce.number().int().positive().optional(),
    pricingType: z.enum(['free', 'monthly', 'per_use']).optional(),
    perUseFee: z.coerce.number().nullable().optional(),
    restrictedMainContracts: z.array(z.string()).default([]),
    restrictedOptionContracts: z.array(z.string()).default([]),
    images: z.array(LessonImageItemSchema).default([]),
    description: z.string().max(TEXT_EDITOR_MAX_LENGTH).optional().default(''),
    notes: z.string().max(TEXTAREA_MAX_LENGTH).optional().default(''),
    status: z.enum(['active', 'inactive']).default('active'),
  })
  .superRefine((data, ctx) => {
    // Required checks live here (rather than on each field's own type) so that a
    // missing brand/duration never short-circuits the other checks below it —
    // Zod skips a schema's superRefine once any sibling field has a base-type
    // (fatal) issue, which a bare `undefined` on a non-optional field triggers.
    if (!data.name.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'レッスン名は必須です。',
        path: ['name'],
      });
    }
    if (!data.brand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ブランドは必須です。',
        path: ['brand'],
      });
    }
    if (data.duration === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '所要時間は必須です。',
        path: ['duration'],
      });
    }
    if (!data.pricingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '料金種別は必須です。',
        path: ['pricingType'],
      });
    }
    if (
      data.pricingType === 'per_use' &&
      (data.perUseFee === null || data.perUseFee === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '都次利用料金は必須です。',
        path: ['perUseFee'],
      });
    }
  });

export type LessonFormInput = z.input<typeof LessonFormSchema>;
export type LessonFormValues = z.output<typeof LessonFormSchema>;
export type LessonFormMode = 'create' | 'edit' | 'duplicate';
