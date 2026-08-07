import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { StoreListBrandSchema } from './store.schema';

extendZodWithOpenApi(z);

export const SurveyTemplateTypeSchema = z.enum(['lifecycle', 'operational']).openapi({
  title: 'SurveyTemplateType',
  description: 'アンケート種別',
});

export const SurveyTemplateTriggerSchema = z
  .enum([
    'join',
    'leave',
    'suspension_request',
    'transfer',
    'renewal',
    'manual_delivery',
    'conditional_trigger',
  ])
  .openapi({
    title: 'SurveyTemplateTrigger',
    description: '発動トリガー',
  });

export const SurveyTemplateStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'SurveyTemplateStatus',
  description: 'アンケートステータス',
});

export const SurveyQuestionFormatSchema = z
  .enum(['single_choice', 'multiple_choice', 'free_text'])
  .openapi({
    title: 'SurveyQuestionFormat',
    description: '回答形式',
  });

export const SurveyQuestionChoiceSchema = z
  .object({
    order: z.number().int().positive().openapi({ example: 1, description: '表示順' }),
    text: z.string().openapi({ example: '友人の紹介', description: '選択肢テキスト' }),
  })
  .openapi({
    title: 'SurveyQuestionChoice',
    description: 'アンケート設問選択肢',
  });

export const SurveyQuestionSchema = z
  .object({
    no: z.number().int().positive().openapi({ example: 1, description: '設問番号' }),
    content: z
      .string()
      .openapi({ example: '入会のきっかけを教えてください', description: '設問内容' }),
    format: SurveyQuestionFormatSchema.openapi({ description: '回答形式' }),
    required: z.boolean().openapi({ example: true, description: '必答かどうか' }),
    has_responses: z
      .boolean()
      .optional()
      .openapi({ example: true, description: '回答データの有無' }),
    choices: z.array(SurveyQuestionChoiceSchema).openapi({ description: '選択肢一覧' }),
  })
  .openapi({
    title: 'SurveyQuestion',
    description: 'アンケート設問',
  });

export const SurveyTemplateListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'S-001', description: 'アンケートID' }),
    name: z.string().openapi({ example: '入会時アンケート', description: 'アンケート名' }),
    type: SurveyTemplateTypeSchema.openapi({ description: '種別' }),
    trigger: SurveyTemplateTriggerSchema.openapi({ description: '発動トリガー' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    question_count: z.number().int().nonnegative().openapi({ example: 5, description: '設問数' }),
    response_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 1840, description: '回答件数' }),
    response_rate: z.number().min(0).max(100).openapi({ example: 78.4, description: '回答率(%)' }),
    last_response_date: z
      .string()
      .nullable()
      .openapi({ example: '2026/03/10', description: '最終回答日' }),
    status: SurveyTemplateStatusSchema.openapi({ description: '状態' }),
  })
  .openapi({
    title: 'SurveyTemplateListItem',
    description: 'アンケートテンプレート一覧アイテム',
  });

export const GetSurveyTemplatesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().optional().openapi({ description: 'アンケート名で検索' }),
    type: SurveyTemplateTypeSchema.optional(),
    brand: StoreListBrandSchema.optional(),
    status: SurveyTemplateStatusSchema.optional(),
    sort_by: z
      .enum([
        'id',
        'name',
        'type',
        'trigger',
        'brand',
        'question_count',
        'response_count',
        'response_rate',
        'last_response_date',
        'status',
      ])
      .default('id'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetSurveyTemplatesQuery',
    description: 'アンケートテンプレート一覧取得クエリ',
  });

export const GetSurveyTemplatesResponseSchema = z
  .object({
    surveys: z.array(SurveyTemplateListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetSurveyTemplatesResponse',
    description: 'アンケートテンプレート一覧レスポンス',
  });

export const SurveyTemplateDetailSchema = SurveyTemplateListItemSchema.extend({
  created_at: z.string().openapi({ example: '2024/04/01', description: '作成日' }),
  updated_at: z.string().openapi({ example: '2026/03/10', description: '最終更新日' }),
  questions: z.array(SurveyQuestionSchema).openapi({ description: '設問一覧' }),
}).openapi({
  title: 'SurveyTemplateDetail',
  description: 'アンケートテンプレート詳細',
});

export const SurveyTemplateUpsertQuestionSchema = z
  .object({
    no: z.number().int().positive().openapi({ example: 1, description: '設問番号' }),
    content: z.string().openapi({ example: '入会のきっかけを教えてください' }),
    format: SurveyQuestionFormatSchema.openapi({ description: '回答形式' }),
    required: z.boolean().openapi({ example: true, description: '必答かどうか' }),
    has_responses: z
      .boolean()
      .optional()
      .openapi({ example: true, description: '回答データの有無' }),
    choices: z.array(SurveyQuestionChoiceSchema).openapi({ description: '選択肢一覧' }),
  })
  .openapi({
    title: 'SurveyTemplateUpsertQuestion',
    description: 'アンケート設問更新用アイテム',
  });

export const SurveyTemplateUpsertBodySchema = z
  .object({
    name: z.string().min(1).openapi({ description: 'アンケート名' }),
    type: SurveyTemplateTypeSchema.openapi({ description: '種別' }),
    trigger: SurveyTemplateTriggerSchema.openapi({ description: '発動トリガー' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    status: SurveyTemplateStatusSchema.openapi({ description: '状態' }),
    questions: z.array(SurveyTemplateUpsertQuestionSchema).openapi({ description: '設問一覧' }),
    replace_existing_survey_id: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '同一トリガーの既存アンケートID' }),
  })
  .openapi({
    title: 'SurveyTemplateUpsertBody',
    description: 'アンケートテンプレート作成・更新リクエスト',
  });

export const SurveyTemplateUpsertResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'アンケートを登録しました' }),
    survey: SurveyTemplateDetailSchema,
  })
  .openapi({
    title: 'SurveyTemplateUpsertResponse',
    description: 'アンケートテンプレート作成・更新レスポンス',
  });

export const GetSurveyTemplateDetailResponseSchema = z
  .object({
    survey: SurveyTemplateDetailSchema,
  })
  .openapi({
    title: 'GetSurveyTemplateDetailResponse',
    description: 'アンケートテンプレート詳細レスポンス',
  });

export const UpdateSurveyTemplateStatusBodySchema = z
  .object({
    status: SurveyTemplateStatusSchema.openapi({ description: '更新後ステータス' }),
    reason: z.string().trim().min(1).nullable().optional().openapi({ description: '変更理由' }),
  })
  .openapi({
    title: 'UpdateSurveyTemplateStatusBody',
    description: 'アンケートステータス更新リクエスト',
  });

export const UpdateSurveyTemplateStatusResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'アンケートを無効化しました' }),
    survey: SurveyTemplateDetailSchema,
  })
  .openapi({
    title: 'UpdateSurveyTemplateStatusResponse',
    description: 'アンケートステータス更新レスポンス',
  });

export const DeleteSurveyTemplateResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'アンケートを削除しました' }),
  })
  .openapi({
    title: 'DeleteSurveyTemplateResponse',
    description: 'アンケート削除レスポンス',
  });

export const SurveyTemplateChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/03/10 14:20', description: '変更日時' }),
    user: z.string().openapi({ example: '管理者A', description: '変更者' }),
    field: z.string().nullable().openapi({ example: 'ステータス', description: '変更項目' }),
    from: z.string().nullable().openapi({ example: '有効', description: '変更前' }),
    to: z.string().nullable().openapi({ example: '無効', description: '変更後' }),
  })
  .openapi({
    title: 'SurveyTemplateChangeHistoryItem',
    description: 'アンケート変更履歴アイテム',
  });

export type SurveyTemplateType = z.infer<typeof SurveyTemplateTypeSchema>;
export type SurveyTemplateTrigger = z.infer<typeof SurveyTemplateTriggerSchema>;
export type SurveyTemplateStatus = z.infer<typeof SurveyTemplateStatusSchema>;
export type SurveyQuestionFormat = z.infer<typeof SurveyQuestionFormatSchema>;
export type SurveyQuestionChoice = z.infer<typeof SurveyQuestionChoiceSchema>;
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyTemplateListItem = z.infer<typeof SurveyTemplateListItemSchema>;
export type GetSurveyTemplatesQuery = z.infer<typeof GetSurveyTemplatesQuerySchema>;
export type GetSurveyTemplatesResponse = z.infer<typeof GetSurveyTemplatesResponseSchema>;
export type SurveyTemplateDetail = z.infer<typeof SurveyTemplateDetailSchema>;
export type SurveyTemplateUpsertQuestion = z.infer<typeof SurveyTemplateUpsertQuestionSchema>;
export type SurveyTemplateUpsertBody = z.infer<typeof SurveyTemplateUpsertBodySchema>;
export type SurveyTemplateUpsertResponse = z.infer<typeof SurveyTemplateUpsertResponseSchema>;
export type GetSurveyTemplateDetailResponse = z.infer<typeof GetSurveyTemplateDetailResponseSchema>;
export type UpdateSurveyTemplateStatusBody = z.infer<typeof UpdateSurveyTemplateStatusBodySchema>;
export type UpdateSurveyTemplateStatusResponse = z.infer<
  typeof UpdateSurveyTemplateStatusResponseSchema
>;
export type DeleteSurveyTemplateResponse = z.infer<typeof DeleteSurveyTemplateResponseSchema>;
export type SurveyTemplateChangeHistoryItem = z.infer<typeof SurveyTemplateChangeHistoryItemSchema>;
export { ErrorResponseSchema };
