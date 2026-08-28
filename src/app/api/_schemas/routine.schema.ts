import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

// ─── Enums ─────────────────────────────────────────────────────────────────

export const RoutinePublishStatusSchema = z.enum(['unpublished', 'published']).openapi({
  title: 'RoutinePublishStatus',
  description: '公開ステータス',
});

export const RoutineBrandSchema = z.enum(['joyfit', 'fit365']).openapi({
  title: 'RoutineBrand',
  description: 'ブランド区分',
});

export const RoutineSetTypeSchema = z.enum(['normal', 'superset']).openapi({
  title: 'RoutineSetType',
  description: 'セットタイプ（Phase 1 は normal のみ）',
});

// ─── Set / Exercise (detail response shapes) ─────────────────────────────────

export const RoutineSetSchema = z
  .object({
    setNumber: z.number().int().openapi({ example: 1 }),
    setType: RoutineSetTypeSchema,
    supersetGroup: z.string().nullable().openapi({ example: null }),
    targetWeightKg: z.number().nullable().openapi({ example: 20 }),
    targetReps: z.number().nullable().openapi({ example: 10 }),
    targetDurationSeconds: z.number().nullable().openapi({ example: null }),
    targetDistanceM: z.number().nullable().openapi({ example: null }),
    targetRpe: z.number().nullable().openapi({ example: 6 }),
  })
  .openapi({
    title: 'RoutineSet',
    description: 'ルーティンセット定義',
  });

export const RoutineExerciseSchema = z
  .object({
    exerciseId: z.string().openapi({ example: 'EX-001' }),
    exerciseName: z.string().openapi({ example: 'ベンチプレス' }),
    categoryName: z.string().openapi({ example: '胸' }),
    sortOrder: z.number().int().openapi({ example: 0 }),
    hqComment: z.string().nullable().openapi({ example: 'フォームを優先。' }),
    sets: z.array(RoutineSetSchema),
  })
  .openapi({
    title: 'RoutineExercise',
    description: 'ルーティン内エクササイズ',
  });

// ─── List ────────────────────────────────────────────────────────────────────

export const RoutineListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'RT-001' }),
    routineCode: z.string().openapi({ example: 'RT-00031' }),
    name: z.string().openapi({ example: 'ビギナー全身ルーティン' }),
    categoryId: z.string().openapi({ example: 'RC-001' }),
    categoryName: z.string().openapi({ example: 'ビギナー向け' }),
    exerciseCount: z.number().int().openapi({ example: 5 }),
    publishStatus: RoutinePublishStatusSchema,
    updatedAt: z.string().openapi({ example: '2026-06-05T10:00:00Z' }),
  })
  .openapi({
    title: 'RoutineListItem',
    description: 'ルーティン一覧アイテム',
  });

export const RoutinePaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 50 }),
    totalItems: z.number().int().openapi({ example: 10 }),
    totalPages: z.number().int().openapi({ example: 1 }),
    totalAllItems: z.number().int().openapi({
      example: 50,
      description: 'フィルター適用前の総件数',
    }),
  })
  .openapi({
    title: 'RoutinePagination',
    description: 'ルーティン一覧ページング',
  });

export const GetRoutinesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    search: z.string().optional().openapi({ description: 'ルーティン名検索（部分一致）' }),
    categoryId: z.string().optional(),
    publishStatus: RoutinePublishStatusSchema.optional(),
    sortBy: z.enum(['name', 'exerciseCount', 'publishStatus', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetRoutinesQuery',
    description: 'ルーティン一覧取得クエリ',
  });

export const GetRoutinesResponseSchema = z
  .object({
    items: z.array(RoutineListItemSchema),
    pagination: RoutinePaginationSchema,
  })
  .openapi({
    title: 'GetRoutinesResponse',
    description: 'ルーティン一覧レスポンス',
  });

// ─── Detail ────────────────────────────────────────────────────────────────

export const RoutineDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'RT-001' }),
    routineCode: z.string().openapi({ example: 'RT-00031' }),
    name: z.string().openapi({ example: 'ビギナー全身ルーティン' }),
    categoryId: z.string().openapi({ example: 'RC-001' }),
    categoryName: z.string().openapi({ example: 'ビギナー向け' }),
    description: z.string().nullable().openapi({ example: '初めての方向けの全身トレーニング。' }),
    thumbnailS3Keys: z.array(z.string()).max(5).openapi({ description: '先頭がメイン画像' }),
    publishStatus: RoutinePublishStatusSchema,
    publishedAt: z.string().nullable().openapi({ example: null }),
    exerciseCount: z.number().int().openapi({ example: 2 }),
    exercises: z.array(RoutineExerciseSchema),
    createdByStaffId: z.string().openapi({ example: 'STF-001' }),
    updatedByStaffId: z.string().openapi({ example: 'STF-002' }),
    updatedByName: z.string().openapi({ example: '本部 花子' }),
    createdAt: z.string().openapi({ example: '2026-06-05T09:00:00Z' }),
    updatedAt: z.string().openapi({ example: '2026-06-05T10:00:00Z' }),
  })
  .openapi({
    title: 'RoutineDetail',
    description: 'ルーティン詳細',
  });

// ─── Create / Edit request body ──────────────────────────────────────────────

export const UpsertRoutineSetInputSchema = z
  .object({
    targetReps: z.number().min(0, '推奨Rep数は0以上で入力してください').nullable().optional(),
    targetWeightKg: z.number().min(0, '推奨重量は0以上で入力してください').nullable().optional(),
    targetDurationSeconds: z.number().min(0).nullable().optional(),
    targetDistanceM: z.number().min(0).nullable().optional(),
    targetRpe: z.number().min(0).max(10).nullable().optional(),
    setType: RoutineSetTypeSchema.default('normal'),
  })
  .openapi({
    title: 'UpsertRoutineSetInput',
    description: 'セット入力',
  });

export const UpsertRoutineExerciseInputSchema = z
  .object({
    exerciseId: z.string().min(1),
    sortOrder: z.number().int().min(0),
    hqComment: z.string().nullable().optional(),
    sets: z.array(UpsertRoutineSetInputSchema).default([]),
  })
  .openapi({
    title: 'UpsertRoutineExerciseInput',
    description: 'エクササイズ構成入力',
  });

export const UpsertRoutineBodySchema = z
  .object({
    name: z.string().min(1, 'ルーティン名は必須です'),
    categoryId: z.string().min(1, 'ルーティンカテゴリは必須です'),
    description: z.string().nullable().optional(),
    thumbnailS3Keys: z.array(z.string()).max(5).default([]),
    exercises: z.array(UpsertRoutineExerciseInputSchema).default([]),
  })
  .openapi({
    title: 'UpsertRoutineBody',
    description: 'ルーティン作成・更新リクエスト',
  });

export const CreateRoutineResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ルーティンを登録しました' }),
    routine: RoutineDetailSchema,
  })
  .openapi({
    title: 'CreateRoutineResponse',
    description: 'ルーティン作成レスポンス',
  });

export const UpdateRoutineResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ルーティンを更新しました' }),
    routine: RoutineDetailSchema,
  })
  .openapi({
    title: 'UpdateRoutineResponse',
    description: 'ルーティン更新レスポンス',
  });

export const GetRoutineDetailResponseSchema = z
  .object({
    routine: RoutineDetailSchema,
  })
  .openapi({
    title: 'GetRoutineDetailResponse',
    description: 'ルーティン詳細レスポンス',
  });

// ─── Publish / unpublish ─────────────────────────────────────────────────────

export const UpdateRoutinePublishStatusBodySchema = z
  .object({
    publishStatus: RoutinePublishStatusSchema,
  })
  .openapi({
    title: 'UpdateRoutinePublishStatusBody',
    description: 'ルーティン公開状態更新リクエスト',
  });

export const UpdateRoutinePublishStatusResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ステータスを更新しました' }),
    routine: RoutineDetailSchema,
  })
  .openapi({
    title: 'UpdateRoutinePublishStatusResponse',
    description: 'ルーティン公開状態更新レスポンス',
  });

// ─── Duplicate ───────────────────────────────────────────────────────────────

export const DuplicateRoutineResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ルーティンを複製しました' }),
    routine: RoutineDetailSchema,
  })
  .openapi({
    title: 'DuplicateRoutineResponse',
    description: 'ルーティン複製レスポンス',
  });

// ─── Delete ──────────────────────────────────────────────────────────────────

export const DeleteRoutineResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ルーティンを削除しました' }),
  })
  .openapi({
    title: 'DeleteRoutineResponse',
    description: 'ルーティン削除レスポンス',
  });

export type RoutinePublishStatus = z.infer<typeof RoutinePublishStatusSchema>;
export type RoutineBrand = z.infer<typeof RoutineBrandSchema>;
export type RoutineSetType = z.infer<typeof RoutineSetTypeSchema>;
export type RoutineSet = z.infer<typeof RoutineSetSchema>;
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineListItem = z.infer<typeof RoutineListItemSchema>;
export type GetRoutinesQuery = z.infer<typeof GetRoutinesQuerySchema>;
export type GetRoutinesResponse = z.infer<typeof GetRoutinesResponseSchema>;
export type RoutineDetail = z.infer<typeof RoutineDetailSchema>;
export type UpsertRoutineSetInput = z.infer<typeof UpsertRoutineSetInputSchema>;
export type UpsertRoutineExerciseInput = z.infer<typeof UpsertRoutineExerciseInputSchema>;
export type UpsertRoutineBody = z.infer<typeof UpsertRoutineBodySchema>;
export type CreateRoutineResponse = z.infer<typeof CreateRoutineResponseSchema>;
export type UpdateRoutineResponse = z.infer<typeof UpdateRoutineResponseSchema>;
export type GetRoutineDetailResponse = z.infer<typeof GetRoutineDetailResponseSchema>;
export type UpdateRoutinePublishStatusBody = z.infer<typeof UpdateRoutinePublishStatusBodySchema>;
export type UpdateRoutinePublishStatusResponse = z.infer<
  typeof UpdateRoutinePublishStatusResponseSchema
>;
export type DuplicateRoutineResponse = z.infer<typeof DuplicateRoutineResponseSchema>;
export type DeleteRoutineResponse = z.infer<typeof DeleteRoutineResponseSchema>;
export { ErrorResponseSchema };
