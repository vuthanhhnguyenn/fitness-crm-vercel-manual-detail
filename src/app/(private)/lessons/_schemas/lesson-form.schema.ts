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
    name: z.string().min(1, 'レッスン名は必須です。').max(255),
    lessonType: z.enum(['studio', 'personal', 'bodycare']).default('studio'),
    brand: z.enum(['joyfit', 'fit365'], { error: 'ブランドは必須です。' }),
    duration: z.coerce.number({ error: '所要時間は必須です。' }).int().positive(),
    pricingType: z.enum(['free', 'monthly', 'per_use'], {
      error: '料金種別は必須です。',
    }),
    perUseFee: z.coerce.number().nullable().optional(),
    restrictedMainContracts: z.array(z.string()).default([]),
    restrictedOptionContracts: z.array(z.string()).default([]),
    images: z.array(LessonImageItemSchema).default([]),
    description: z.string().max(10000).optional().default(''),
    notes: z.string().max(1000).optional().default(''),
    status: z.enum(['active', 'inactive']).default('active'),
  })
  .superRefine((data, ctx) => {
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
