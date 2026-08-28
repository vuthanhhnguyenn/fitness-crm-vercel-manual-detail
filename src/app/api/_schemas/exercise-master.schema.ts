import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

export const ExerciseMasterKindSchema = z
  .enum(['category', 'muscle', 'tool', 'exercise_type'])
  .openapi({
    title: 'ExerciseMasterKind',
    description: 'エクササイズ参照マスタ種別',
  });

export const ExerciseMasterStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'ExerciseMasterStatus',
  description: '参照マスタステータス',
});

export const ExerciseMasterDeleteBlockReasonSchema = z.enum(['in_use_by_exercise']).openapi({
  title: 'ExerciseMasterDeleteBlockReason',
  description: '削除不可理由',
});

export const ExerciseMasterListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'CAT-001' }),
    code: z.string().openapi({ example: 'chest' }),
    name: z.string().openapi({ example: '胸' }),
    description: z.string().nullable().openapi({
      example: '大胸筋を主体とした胸部のトレーニング種目',
    }),
    sortOrder: z.number().int().openapi({ example: 1 }),
    usageCount: z.number().int().nonnegative().openapi({ example: 24 }),
    status: ExerciseMasterStatusSchema,
    updatedAt: z.string().openapi({ example: '2026-01-15T00:00:00Z' }),
  })
  .openapi({
    title: 'ExerciseMasterListItem',
    description: 'エクササイズ参照マスタ一覧アイテム',
  });

export const ExerciseMasterDetailSchema = ExerciseMasterListItemSchema.extend({
  createdAt: z.string().openapi({ example: '2025-04-01T00:00:00Z' }),
  deletedAt: z.string().nullable().openapi({ example: null }),
  updatedBy: z.string().openapi({ example: '本部 花子' }),
}).openapi({
  title: 'ExerciseMasterDetail',
  description: 'エクササイズ参照マスタ詳細',
});

export const GetExerciseMasterListQuerySchema = z
  .object({
    search: z.string().optional().openapi({ description: '名称・コード・説明の検索語' }),
  })
  .openapi({
    title: 'GetExerciseMasterListQuery',
    description: '参照マスタ一覧取得クエリ',
  });

export const GetExerciseMasterListResponseSchema = z
  .object({
    items: z.array(ExerciseMasterListItemSchema),
  })
  .openapi({
    title: 'GetExerciseMasterListResponse',
    description: '参照マスタ一覧レスポンス',
  });

export const GetExerciseMasterDetailResponseSchema = z
  .object({
    item: ExerciseMasterDetailSchema,
  })
  .openapi({
    title: 'GetExerciseMasterDetailResponse',
    description: '参照マスタ詳細レスポンス',
  });

export const CreateExerciseMasterBodySchema = z
  .object({
    code: z.string().min(1, 'コードは必須です'),
    name: z.string().min(1, '名称は必須です'),
    description: z.string().nullable().optional(),
    sortOrder: z.number().int().min(1, '表示順は必須です'),
  })
  .openapi({
    title: 'CreateExerciseMasterBody',
    description: '参照マスタ作成リクエスト',
  });

export const UpdateExerciseMasterBodySchema = z
  .object({
    name: z.string().min(1, '名称は必須です'),
    description: z.string().nullable().optional(),
    sortOrder: z.number().int().min(1, '表示順は必須です'),
  })
  .openapi({
    title: 'UpdateExerciseMasterBody',
    description: '参照マスタ更新リクエスト',
  });

export const CreateExerciseMasterResponseSchema = z
  .object({
    message: z.string().openapi({ example: '参照マスタを登録しました' }),
    item: ExerciseMasterDetailSchema,
  })
  .openapi({
    title: 'CreateExerciseMasterResponse',
    description: '参照マスタ作成レスポンス',
  });

export const UpdateExerciseMasterResponseSchema = z
  .object({
    message: z.string().openapi({ example: '参照マスタを更新しました' }),
    item: ExerciseMasterDetailSchema,
  })
  .openapi({
    title: 'UpdateExerciseMasterResponse',
    description: '参照マスタ更新レスポンス',
  });

export const DeleteExerciseMasterResponseSchema = z
  .object({
    message: z.string().openapi({ example: '参照マスタを削除しました' }),
  })
  .openapi({
    title: 'DeleteExerciseMasterResponse',
    description: '参照マスタ削除レスポンス',
  });

export const DeleteExerciseMasterBlockedResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'エクササイズから参照中のため削除できません' }),
    blockReason: ExerciseMasterDeleteBlockReasonSchema,
  })
  .openapi({
    title: 'DeleteExerciseMasterBlockedResponse',
    description: '参照マスタ削除不可レスポンス',
  });

export type ExerciseMasterKind = z.infer<typeof ExerciseMasterKindSchema>;
export type ExerciseMasterStatus = z.infer<typeof ExerciseMasterStatusSchema>;
export type ExerciseMasterDeleteBlockReason = z.infer<typeof ExerciseMasterDeleteBlockReasonSchema>;
export type ExerciseMasterListItem = z.infer<typeof ExerciseMasterListItemSchema>;
export type ExerciseMasterDetail = z.infer<typeof ExerciseMasterDetailSchema>;
export type GetExerciseMasterListQuery = z.infer<typeof GetExerciseMasterListQuerySchema>;
export type GetExerciseMasterListResponse = z.infer<typeof GetExerciseMasterListResponseSchema>;
export type GetExerciseMasterDetailResponse = z.infer<typeof GetExerciseMasterDetailResponseSchema>;
export type CreateExerciseMasterBody = z.infer<typeof CreateExerciseMasterBodySchema>;
export type UpdateExerciseMasterBody = z.infer<typeof UpdateExerciseMasterBodySchema>;
export type CreateExerciseMasterResponse = z.infer<typeof CreateExerciseMasterResponseSchema>;
export type UpdateExerciseMasterResponse = z.infer<typeof UpdateExerciseMasterResponseSchema>;
export type DeleteExerciseMasterResponse = z.infer<typeof DeleteExerciseMasterResponseSchema>;
export type DeleteExerciseMasterBlockedResponse = z.infer<
  typeof DeleteExerciseMasterBlockedResponseSchema
>;

export { ErrorResponseSchema };
