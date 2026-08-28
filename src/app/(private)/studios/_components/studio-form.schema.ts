import { CAPACITY_MAX_SIZE, TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export const StudioImageItemSchema = z.object({
  id: z.string(),
  url: z.string(),
});

export type StudioImageItem = z.infer<typeof StudioImageItemSchema>;

export const StudioLayoutCellKindSchema = z.enum([
  'normal_seat',
  'equipment_seat',
  'fixed_object',
  'empty',
]);

export type StudioLayoutCellKind = z.infer<typeof StudioLayoutCellKindSchema>;

export const LayoutCellSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  kind: StudioLayoutCellKindSchema,
});

export type LayoutCell = z.infer<typeof LayoutCellSchema>;

export const SpaceLayoutSchema = z.object({
  rows: z.number().int().min(2).max(5),
  columns: z
    .number()
    .int()
    .refine((v) => [6, 8, 10].includes(v), {
      message: 'Columns must be 6, 8, or 10',
    }),
  cells: z.array(LayoutCellSchema).default([]),
});

export type SpaceLayout = z.infer<typeof SpaceLayoutSchema>;

export const StudioFormSchema = z.object({
  storeId: z.string().min(1, '店舗名は必須です。'),
  name: z
    .string()
    .trim()
    .min(1, 'スタジオ名は必須です。')
    .max(TEXT_MAX_LENGTH, `スタジオ名は${TEXT_MAX_LENGTH}文字以内で入力してください。`),
  studioType: z.enum(['studio-lesson', 'pt', 'body-care'], {
    error: 'スタジオ区分は必須です。',
  }),
  operatingHours: z.string().regex(/^\d{2}:\d{2}~\d{2}:\d{2}$/, {
    message: '利用可能時間は HH:mm~HH:mm 形式で入力してください。',
  }),
  capacity: z.coerce
    .number({ error: '物理定員は必須です。' })
    .int()
    .min(1, '物理定員は必須です。')
    .max(CAPACITY_MAX_SIZE, `物理定員は${CAPACITY_MAX_SIZE}以下にしてください。`),
  bufferValue: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ error: 'バッファ値は必須です。' })
      .int()
      .min(0)
      .max(CAPACITY_MAX_SIZE, `バッファ値は${CAPACITY_MAX_SIZE}以下にしてください。`),
  ),
  equipmentNotes: z.string().max(TEXTAREA_MAX_LENGTH).optional().default(''),
  internalNotes: z.string().max(TEXTAREA_MAX_LENGTH).optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
  images: z.array(StudioImageItemSchema).default([]),
  layout: SpaceLayoutSchema.optional(),
});

export type StudioFormInput = z.input<typeof StudioFormSchema>;
export type StudioFormValues = z.output<typeof StudioFormSchema>;
export type StudioFormMode = 'create' | 'edit';
