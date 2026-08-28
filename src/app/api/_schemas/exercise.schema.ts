import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

export const ExerciseStatusSchema = z.enum(['public', 'private']).openapi({
  title: 'ExerciseStatus',
  description: '公開ステータス',
});

export const ExerciseLevelSchema = z.enum(['beginner', 'expert']).openapi({
  title: 'ExerciseLevel',
  description: 'レベル',
});

export const ExerciseHandUsageSchema = z
  .enum(['both_hands', 'single_hand', 'both_feet', 'single_leg'])
  .openapi({
    title: 'ExerciseHandUsage',
    description: '両手使用区分',
  });

export const ExerciseDeleteBlockReasonSchema = z.enum(['public', 'in_use_by_routine']).openapi({
  title: 'ExerciseDeleteBlockReason',
  description: '削除不可理由',
});

export const ExerciseEquipmentOptionSchema = z
  .object({
    id: z.string().openapi({ example: 'TE-004' }),
    label: z.string().openapi({ example: 'バーベルセット 20-120kg' }),
  })
  .openapi({
    title: 'ExerciseEquipmentOption',
    description: 'エクササイズ紐づけ機材オプション',
  });

export const ExerciseRelatedExerciseSchema = z
  .object({
    id: z.string().openapi({ example: 'EX-002' }),
    exerciseCode: z.string().openapi({ example: 'EX-00043' }),
    nameJa: z.string().openapi({ example: 'スクワット' }),
    categoryName: z.string().openapi({ example: '脚' }),
    level: ExerciseLevelSchema,
  })
  .openapi({
    title: 'ExerciseRelatedExercise',
    description: '関連エクササイズ要約',
  });

export const ExerciseListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'EX-001' }),
    exerciseCode: z.string().openapi({ example: 'EX-00042' }),
    nameJa: z.string().openapi({ example: 'ベンチプレス' }),
    categoryName: z.string().openapi({ example: '胸' }),
    primaryMuscleName: z.string().openapi({ example: '大胸筋' }),
    toolName: z.string().openapi({ example: 'バーベル' }),
    level: ExerciseLevelSchema,
    publishStatus: ExerciseStatusSchema,
    updatedAt: z.string().openapi({ example: '2026-06-05T10:00:00Z' }),
    thumbnailUrl: z
      .string()
      .nullable()
      .openapi({ example: 'https://images.unsplash.com/photo-1?w=320&h=240&fit=crop' }),
    canDelete: z.boolean().openapi({ example: false }),
    deleteBlockReason: ExerciseDeleteBlockReasonSchema.nullable(),
  })
  .openapi({
    title: 'ExerciseListItem',
    description: 'エクササイズ一覧アイテム',
  });

export const ExercisePaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    totalItems: z.number().int().openapi({ example: 10 }),
    totalPages: z.number().int().openapi({ example: 1 }),
  })
  .openapi({
    title: 'ExercisePagination',
    description: 'エクササイズ一覧ページング',
  });

export const GetExercisesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().optional().openapi({ description: 'エクササイズ名検索' }),
    categoryId: z.string().optional(),
    primaryMuscleId: z.string().optional(),
    toolId: z.string().optional(),
    level: ExerciseLevelSchema.optional(),
    publishStatus: ExerciseStatusSchema.optional(),
    sortBy: z.enum(['nameJa', 'publishStatus', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetExercisesQuery',
    description: 'エクササイズ一覧取得クエリ',
  });

export const GetExercisesResponseSchema = z
  .object({
    items: z.array(ExerciseListItemSchema),
    pagination: ExercisePaginationSchema,
  })
  .openapi({
    title: 'GetExercisesResponse',
    description: 'エクササイズ一覧レスポンス',
  });

export const ExerciseImageSchema = z
  .object({
    id: z.string().openapi({ example: 'IMG-001' }),
    url: z
      .string()
      .openapi({ example: 'https://images.unsplash.com/photo-1?w=800&h=600&fit=crop' }),
    sortOrder: z.number().int().openapi({ example: 0 }),
    isPrimary: z.boolean().openapi({ example: true }),
  })
  .openapi({
    title: 'ExerciseImage',
    description: 'エクササイズ画像',
  });

export const ExerciseStepSchema = z
  .object({
    step: z.number().int().min(0).max(4).openapi({ example: 0 }),
    label: z.string().openapi({ example: 'トレーニングポイント' }),
    textJa: z.string().openapi({ example: '胸を張って肩甲骨を寄せる' }),
    textEn: z
      .string()
      .nullable()
      .openapi({ example: 'Keep your chest up and shoulder blades retracted.' }),
    isMissing: z.boolean().openapi({ example: false }),
  })
  .openapi({
    title: 'ExerciseStep',
    description: '解説ステップ',
  });

export const ExerciseTagSettingSchema = z
  .object({
    id: z.string().openapi({ example: 'grip-narrow' }),
    label: z.string().openapi({ example: 'ナローグリップ' }),
    category: z.string().openapi({ example: 'グリップ' }),
    enabled: z.boolean().openapi({ example: true }),
  })
  .openapi({
    title: 'ExerciseTagSetting',
    description: 'エクササイズタグ設定',
  });

export const ExerciseDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'EX-001' }),
    exerciseCode: z.string().openapi({ example: 'EX-00042' }),
    nameJa: z.string().openapi({ example: 'ベンチプレス' }),
    nameEn: z.string().nullable().openapi({ example: 'Bench Press' }),
    overviewJa: z
      .string()
      .nullable()
      .openapi({ example: '大胸筋を中心に上半身を鍛える種目です。' }),
    overviewEn: z
      .string()
      .nullable()
      .openapi({ example: 'A compound upper-body pressing exercise focused on the chest.' }),
    categoryId: z.string().openapi({ example: 'CAT-001' }),
    categoryName: z.string().openapi({ example: '胸' }),
    primaryMuscleId: z.string().openapi({ example: 'MSC-001' }),
    primaryMuscleName: z.string().openapi({ example: '大胸筋' }),
    secondaryMuscleIds: z.array(z.string()),
    secondaryMuscleNames: z.array(z.string()),
    toolId: z.string().openapi({ example: 'TOOL-005' }),
    toolName: z.string().openapi({ example: 'バーベル' }),
    exerciseTypeId: z.string().openapi({ example: 'ET-001' }),
    exerciseTypeName: z.string().openapi({ example: '重さ＆回数' }),
    handUsage: ExerciseHandUsageSchema,
    level: ExerciseLevelSchema,
    restSeconds: z.number().int().openapi({ example: 90 }),
    publishStatus: ExerciseStatusSchema,
    updatedAt: z.string().openapi({ example: '2026-06-05T10:00:00Z' }),
    updatedBy: z.string().openapi({ example: '山田 太郎' }),
    videoUrl: z.string().nullable().openapi({ example: 'https://www.youtube.com/watch?v=example' }),
    images: z.array(ExerciseImageSchema).max(5),
    explanationSteps: z.array(ExerciseStepSchema).length(5),
    linkedEquipment: z.array(ExerciseEquipmentOptionSchema),
    relatedExercises: z.array(ExerciseRelatedExerciseSchema).max(3),
    tags: z.array(ExerciseTagSettingSchema),
    canDelete: z.boolean().openapi({ example: false }),
    deleteBlockReason: ExerciseDeleteBlockReasonSchema.nullable(),
  })
  .openapi({
    title: 'ExerciseDetail',
    description: 'エクササイズ詳細',
  });

export const GetExerciseDetailResponseSchema = z
  .object({
    exercise: ExerciseDetailSchema,
  })
  .openapi({
    title: 'GetExerciseDetailResponse',
    description: 'エクササイズ詳細レスポンス',
  });

export const ExerciseStepInputSchema = z
  .object({
    step: z.number().int().min(0).max(4),
    textJa: z.string().default(''),
    textEn: z.string().nullable().optional(),
  })
  .openapi({
    title: 'ExerciseStepInput',
    description: '解説ステップ入力',
  });

export const UpsertExerciseBodySchema = z
  .object({
    nameJa: z.string().min(1, 'エクササイズ名（日本語）は必須です'),
    nameEn: z.string().nullable().optional(),
    overviewJa: z.string().nullable().optional(),
    overviewEn: z.string().nullable().optional(),
    categoryId: z.string().min(1, 'カテゴリは必須です'),
    primaryMuscleId: z.string().min(1, '主働筋は必須です'),
    secondaryMuscleIds: z.array(z.string()).default([]),
    toolId: z.string().min(1, '器具種別は必須です'),
    exerciseTypeId: z.string().min(1, 'エクササイズタイプは必須です'),
    handUsage: ExerciseHandUsageSchema,
    level: ExerciseLevelSchema,
    restSeconds: z.number().int().min(0).default(90),
    publishStatus: ExerciseStatusSchema.default('private'),
    videoUrl: z.string().url('動画URLの形式が不正です').nullable().or(z.literal('')).optional(),
    images: z
      .array(
        z.object({
          url: z.string().min(1),
          sortOrder: z.number().int().min(0),
          isPrimary: z.boolean().default(false),
        }),
      )
      .max(5)
      .default([]),
    explanationSteps: z.array(ExerciseStepInputSchema).length(5),
    linkedEquipmentIds: z.array(z.string()).default([]),
    relatedExerciseIds: z.array(z.string()).max(3).default([]),
    enabledTagIds: z.array(z.string()).default([]),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.relatedExerciseIds).size !== value.relatedExerciseIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['relatedExerciseIds'],
        message: '関連エクササイズは重複して選択できません',
      });
    }
  })
  .openapi({
    title: 'UpsertExerciseBody',
    description: 'エクササイズ作成・更新リクエスト',
  });

export const CreateExerciseResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'エクササイズを登録しました' }),
    exercise: ExerciseDetailSchema,
  })
  .openapi({
    title: 'CreateExerciseResponse',
    description: 'エクササイズ作成レスポンス',
  });

export const UpdateExerciseResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'エクササイズを更新しました' }),
    exercise: ExerciseDetailSchema,
  })
  .openapi({
    title: 'UpdateExerciseResponse',
    description: 'エクササイズ更新レスポンス',
  });

export const UpdateExercisePublishStatusBodySchema = z
  .object({
    publishStatus: ExerciseStatusSchema,
  })
  .openapi({
    title: 'UpdateExercisePublishStatusBody',
    description: 'エクササイズ公開状態更新リクエスト',
  });

export const UpdateExercisePublishStatusResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ステータスを更新しました' }),
    exercise: ExerciseDetailSchema,
    incompleteStepWarning: z.boolean().openapi({ example: false }),
  })
  .openapi({
    title: 'UpdateExercisePublishStatusResponse',
    description: 'エクササイズ公開状態更新レスポンス',
  });

export const DeleteExerciseResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'エクササイズを削除しました' }),
  })
  .openapi({
    title: 'DeleteExerciseResponse',
    description: 'エクササイズ削除レスポンス',
  });

export const DeleteExerciseBlockedResponseSchema = z
  .object({
    error: z.string().openapi({ example: '使用中のため削除できません' }),
    blockReason: ExerciseDeleteBlockReasonSchema,
  })
  .openapi({
    title: 'DeleteExerciseBlockedResponse',
    description: 'エクササイズ削除不可レスポンス',
  });

export type ExerciseStatus = z.infer<typeof ExerciseStatusSchema>;
export type ExerciseLevel = z.infer<typeof ExerciseLevelSchema>;
export type ExerciseHandUsage = z.infer<typeof ExerciseHandUsageSchema>;
export type ExerciseDeleteBlockReason = z.infer<typeof ExerciseDeleteBlockReasonSchema>;
export type ExerciseEquipmentOption = z.infer<typeof ExerciseEquipmentOptionSchema>;
export type ExerciseListItem = z.infer<typeof ExerciseListItemSchema>;
export type GetExercisesQuery = z.infer<typeof GetExercisesQuerySchema>;
export type GetExercisesResponse = z.infer<typeof GetExercisesResponseSchema>;
export type ExerciseImage = z.infer<typeof ExerciseImageSchema>;
export type ExerciseStep = z.infer<typeof ExerciseStepSchema>;
export type ExerciseTagSetting = z.infer<typeof ExerciseTagSettingSchema>;
export type ExerciseDetail = z.infer<typeof ExerciseDetailSchema>;
export type UpsertExerciseBody = z.infer<typeof UpsertExerciseBodySchema>;
export type CreateExerciseResponse = z.infer<typeof CreateExerciseResponseSchema>;
export type UpdateExerciseResponse = z.infer<typeof UpdateExerciseResponseSchema>;
export type UpdateExercisePublishStatusBody = z.infer<typeof UpdateExercisePublishStatusBodySchema>;
export type UpdateExercisePublishStatusResponse = z.infer<
  typeof UpdateExercisePublishStatusResponseSchema
>;
export type DeleteExerciseResponse = z.infer<typeof DeleteExerciseResponseSchema>;
export { ErrorResponseSchema };
