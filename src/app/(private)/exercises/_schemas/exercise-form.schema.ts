import { z } from 'zod';

import type {
  GetCrmExercisesByIdResponse,
  PatchCrmExercisesByIdData,
  PostCrmExercisesData,
} from '@/lib/api/types.gen';

export const ExerciseFormSchema = z.object({
  exerciseCode: z.string(),
  nameJa: z.string().min(1, 'エクササイズ名（日本語）は必須です'),
  nameEn: z.string().nullable(),
  overviewJa: z.string().nullable(),
  overviewEn: z.string().nullable(),
  categoryId: z.string().min(1, 'カテゴリは必須です'),
  primaryMuscleId: z.string().min(1, '主働筋は必須です'),
  secondaryMuscleIds: z.array(z.string()).default([]),
  toolId: z.string().min(1, '器具種別は必須です'),
  exerciseTypeId: z.string().min(1, 'エクササイズタイプは必須です'),
  handUsage: z.enum(['both_hands', 'single_hand', 'both_feet', 'single_leg'], {
    error: '両手使用区分は必須です',
  }),
  level: z.enum(['beginner', 'expert'], { error: 'レベルは必須です' }),
  restSeconds: z.coerce.number().int().min(0).optional(),
  publishStatus: z.enum(['public', 'private']).default('private'),
  videoUrl: z
    .string()
    .trim()
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || /^https?:\/\//.test(value), '動画URLの形式が不正です'),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1, '画像URLを入力してください'),
        isPrimary: z.boolean(),
      }),
    )
    .max(5),
  explanationSteps: z
    .array(
      z.object({
        step: z.number().int().min(0).max(4),
        textJa: z.string(),
        textEn: z.string().nullable(),
      }),
    )
    .length(5),
  linkedEquipmentIds: z.array(z.string()).default([]),
  relatedExerciseIds: z.array(z.string()).max(3).default([]),
  enabledTagIds: z.array(z.string()).default([]),
});

export type ExerciseDetail = NonNullable<GetCrmExercisesByIdResponse>['exercise'];
export type ExerciseFormInput = z.input<typeof ExerciseFormSchema>;
export type ExerciseFormValues = z.output<typeof ExerciseFormSchema>;

export function createExerciseFormDefaults(): ExerciseFormValues {
  return {
    exerciseCode: '自動採番',
    nameJa: '',
    nameEn: '',
    overviewJa: '',
    overviewEn: '',
    categoryId: '',
    primaryMuscleId: '',
    secondaryMuscleIds: [],
    toolId: '',
    exerciseTypeId: '',
    handUsage: 'both_hands',
    level: 'beginner',
    restSeconds: undefined,
    publishStatus: 'private',
    videoUrl: '',
    images: [],
    explanationSteps: Array.from({ length: 5 }, (_, step) => ({
      step,
      textJa: '',
      textEn: '',
    })),
    linkedEquipmentIds: [],
    relatedExerciseIds: [],
    enabledTagIds: [],
  };
}

export function mapExerciseDetailToFormValues(detail: ExerciseDetail): ExerciseFormValues {
  return {
    exerciseCode: detail.exerciseCode,
    nameJa: detail.nameJa,
    nameEn: detail.nameEn ?? '',
    overviewJa: detail.overviewJa ?? '',
    overviewEn: detail.overviewEn ?? '',
    categoryId: detail.categoryId,
    primaryMuscleId: detail.primaryMuscleId,
    secondaryMuscleIds: detail.secondaryMuscleIds,
    toolId: detail.toolId,
    exerciseTypeId: detail.exerciseTypeId,
    handUsage: detail.handUsage,
    level: detail.level,
    restSeconds: detail.restSeconds,
    publishStatus: detail.publishStatus,
    videoUrl: detail.videoUrl ?? '',
    images: detail.images.map((image: ExerciseDetail['images'][number]) => ({
      url: image.url,
      isPrimary: image.isPrimary,
    })),
    explanationSteps: detail.explanationSteps.map(
      (step: ExerciseDetail['explanationSteps'][number]) => ({
        step: step.step,
        textJa: step.textJa,
        textEn: step.textEn ?? '',
      }),
    ),
    linkedEquipmentIds: detail.linkedEquipment.map(
      (item: ExerciseDetail['linkedEquipment'][number]) => item.id,
    ),
    relatedExerciseIds: detail.relatedExercises.map(
      (item: ExerciseDetail['relatedExercises'][number]) => item.id,
    ),
    enabledTagIds: detail.tags
      .filter((tag: ExerciseDetail['tags'][number]) => tag.enabled)
      .map((tag: ExerciseDetail['tags'][number]) => tag.id),
  };
}

export function mapExerciseFormValuesToBody(
  values: ExerciseFormValues,
): PostCrmExercisesData['body'] & PatchCrmExercisesByIdData['body'] {
  const hasPrimaryImage = values.images.some((image) => image.isPrimary);
  return {
    nameJa: values.nameJa,
    nameEn: values.nameEn || null,
    overviewJa: values.overviewJa || null,
    overviewEn: values.overviewEn || null,
    categoryId: values.categoryId,
    primaryMuscleId: values.primaryMuscleId,
    secondaryMuscleIds: values.secondaryMuscleIds,
    toolId: values.toolId,
    exerciseTypeId: values.exerciseTypeId,
    handUsage: values.handUsage,
    level: values.level,
    restSeconds: values.restSeconds ?? 90,
    publishStatus: values.publishStatus,
    videoUrl: values.videoUrl || null,
    images: values.images.map((image, index) => ({
      url: image.url,
      sortOrder: index,
      isPrimary: hasPrimaryImage ? image.isPrimary : index === 0,
    })),
    explanationSteps: values.explanationSteps.map((step) => ({
      step: step.step,
      textJa: step.textJa,
      textEn: step.textEn || null,
    })),
    linkedEquipmentIds: values.linkedEquipmentIds,
    relatedExerciseIds: values.relatedExerciseIds,
    enabledTagIds: values.enabledTagIds,
  };
}

export function exerciseHasIncompletePublishSteps(values: ExerciseFormValues) {
  if (values.publishStatus !== 'public') return false;
  return values.explanationSteps.some((step) => step.textJa.trim().length === 0);
}
