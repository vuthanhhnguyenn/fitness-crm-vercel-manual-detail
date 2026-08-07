import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { MemberTypeSchema } from './member.schema';
import { StoreListBrandSchema } from './store.schema';
import { SurveyQuestionFormatSchema, SurveyTemplateTypeSchema } from './survey.schema';

extendZodWithOpenApi(z);

const SurveyReportingDateSchema = z
  .string()
  .regex(/^\d{4}\/\d{2}\/\d{2}$/)
  .optional()
  .openapi({ description: '日付 (yyyy/MM/dd)' });

export const SurveyResponseStatusSchema = z.enum(['completed', 'partial']).openapi({
  title: 'SurveyResponseStatus',
  description: '回答ステータス',
});

export const SurveyResponseAnswerSchema = z
  .object({
    question_no: z.number().int().positive().openapi({ description: '設問番号' }),
    question: z.string().openapi({ description: '設問内容' }),
    format: SurveyQuestionFormatSchema.openapi({ description: '回答形式' }),
    answer: z.array(z.string()).openapi({ description: '回答値 (複数可)' }),
  })
  .openapi({
    title: 'SurveyResponseAnswer',
    description: '個別回答の設問回答',
  });

export const SurveyResponseListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'R-001', description: '回答ID' }),
    response_date: z.string().openapi({ example: '2026/03/10 14:32', description: '回答日時' }),
    member_id: z.string().openapi({ example: 'M-00001', description: '会員ID' }),
    member_number: z.string().openapi({ example: 'M-00001', description: '会員番号' }),
    member_name: z.string().openapi({ example: '田中 太郎', description: '会員名' }),
    survey_id: z.string().openapi({ example: 'S-001', description: 'アンケートID' }),
    survey_name: z.string().openapi({ example: '入会時アンケート', description: 'アンケート名' }),
    template_type: SurveyTemplateTypeSchema.openapi({ description: 'テンプレート種別' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    store_id: z.string().openapi({ example: 'store-001', description: '店舗ID' }),
    store_name: z.string().openapi({ example: 'FIT365八潮店', description: '店舗名' }),
    member_type: MemberTypeSchema.openapi({ description: '区分' }),
    answered_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 5, description: '回答済設問数' }),
    total_count: z.number().int().nonnegative().openapi({ example: 5, description: '設問総数' }),
    status: SurveyResponseStatusSchema.openapi({ description: '回答ステータス' }),
  })
  .openapi({
    title: 'SurveyResponseListItem',
    description: 'アンケート回答一覧アイテム',
  });

export const GetSurveyResponsesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().trim().optional().openapi({ description: 'アンケート名で検索' }),
    survey_id: z.string().trim().optional().openapi({ description: '選択中のアンケートID' }),
    period_from: SurveyReportingDateSchema.openapi({ description: '開始日' }),
    period_to: SurveyReportingDateSchema.openapi({ description: '終了日' }),
    brand: StoreListBrandSchema.optional(),
    store_id: z.string().trim().optional(),
    template_type: SurveyTemplateTypeSchema.optional(),
    member_type: MemberTypeSchema.optional(),
  })
  .openapi({
    title: 'GetSurveyResponsesQuery',
    description: 'アンケート回答一覧クエリ',
  });

export const GetSurveyResponsesResponseSchema = z
  .object({
    responses: z.array(SurveyResponseListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetSurveyResponsesResponse',
    description: 'アンケート回答一覧レスポンス',
  });

export const SurveyResponseDetailSchema = SurveyResponseListItemSchema.extend({
  answers: z.array(SurveyResponseAnswerSchema).openapi({ description: '回答内容' }),
}).openapi({
  title: 'SurveyResponseDetail',
  description: 'アンケート回答詳細',
});

export const GetSurveyResponseDetailResponseSchema = z
  .object({
    response: SurveyResponseDetailSchema,
  })
  .openapi({
    title: 'GetSurveyResponseDetailResponse',
    description: 'アンケート回答詳細レスポンス',
  });

export const SurveyAnalyticsChoiceStatSchema = z
  .object({
    label: z.string().openapi({ description: '選択肢ラベル' }),
    count: z.number().int().nonnegative().openapi({ description: '回答件数' }),
    percentage: z.number().min(0).max(100).openapi({ description: '割合(%)' }),
  })
  .openapi({
    title: 'SurveyAnalyticsChoiceStat',
    description: '設問集計の選択肢統計',
  });

export const SurveyAnalyticsFreeTextSampleSchema = z
  .object({
    text: z.string().openapi({ description: '自由記述回答' }),
    answered_at: z.string().openapi({ description: '回答日時' }),
  })
  .openapi({
    title: 'SurveyAnalyticsFreeTextSample',
    description: '自由記述の回答サンプル',
  });

export const SurveyAnalyticsSelectQuestionSchema = z
  .object({
    kind: z.literal('select').openapi({ description: '選択式設問' }),
    no: z.number().int().positive().openapi({ description: '設問番号' }),
    content: z.string().openapi({ description: '設問内容' }),
    format: z.enum(['single_choice', 'multiple_choice']).openapi({ description: '回答形式' }),
    choices: z.array(SurveyAnalyticsChoiceStatSchema).openapi({ description: '選択肢統計' }),
  })
  .openapi({
    title: 'SurveyAnalyticsSelectQuestion',
    description: '選択式設問の集計結果',
  });

export const SurveyAnalyticsFreeTextQuestionSchema = z
  .object({
    kind: z.literal('free_text').openapi({ description: '自由記述設問' }),
    no: z.number().int().positive().openapi({ description: '設問番号' }),
    content: z.string().openapi({ description: '設問内容' }),
    format: z.literal('free_text').openapi({ description: '回答形式' }),
    samples: z.array(SurveyAnalyticsFreeTextSampleSchema).openapi({ description: '回答サンプル' }),
  })
  .openapi({
    title: 'SurveyAnalyticsFreeTextQuestion',
    description: '自由記述設問の集計結果',
  });

export const SurveyAnalyticsQuestionSchema = z
  .discriminatedUnion('kind', [
    SurveyAnalyticsSelectQuestionSchema,
    SurveyAnalyticsFreeTextQuestionSchema,
  ])
  .openapi({
    title: 'SurveyAnalyticsQuestion',
    description: '設問別集計結果',
  });

export const SurveyAnalyticsContextSchema = z
  .object({
    survey_id: z.string().openapi({ description: 'アンケートID' }),
    survey_name: z.string().openapi({ description: 'アンケート名' }),
    template_type: SurveyTemplateTypeSchema.openapi({ description: 'テンプレート種別' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
    store_name: z.string().openapi({ description: '店舗名' }),
    total_responses: z.number().int().nonnegative().openapi({ description: '集計対象回答数' }),
  })
  .openapi({
    title: 'SurveyAnalyticsContext',
    description: '集計対象コンテキスト',
  });

export const SurveyAnalyticsKpiSchema = z
  .object({
    total_responses: z.number().int().nonnegative().openapi({ description: '総回答数' }),
    completed_responses: z.number().int().nonnegative().openapi({ description: '完了回答数' }),
    response_rate: z.number().min(0).max(100).openapi({ description: '回答率(%)' }),
  })
  .openapi({
    title: 'SurveyAnalyticsKpi',
    description: '集計サマリー',
  });

export const GetSurveyAnalyticsQuerySchema = z
  .object({
    search: z.string().trim().optional().openapi({ description: 'アンケート名で検索' }),
    survey_id: z.string().trim().optional().openapi({ description: '選択中のアンケートID' }),
    period_from: SurveyReportingDateSchema.openapi({ description: '開始日' }),
    period_to: SurveyReportingDateSchema.openapi({ description: '終了日' }),
    brand: StoreListBrandSchema.optional(),
    store_id: z.string().trim().optional(),
    template_type: SurveyTemplateTypeSchema.optional(),
    member_type: MemberTypeSchema.optional(),
  })
  .openapi({
    title: 'GetSurveyAnalyticsQuery',
    description: 'アンケート集計クエリ',
  });

export const GetSurveyAnalyticsResponseSchema = z
  .object({
    context: SurveyAnalyticsContextSchema,
    kpis: SurveyAnalyticsKpiSchema,
    questions: z.array(SurveyAnalyticsQuestionSchema),
  })
  .openapi({
    title: 'GetSurveyAnalyticsResponse',
    description: 'アンケート集計レスポンス',
  });

export const SurveyCsvExportRequestSchema = GetSurveyResponsesQuerySchema.omit({
  page: true,
  limit: true,
}).extend({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const SurveyAnalyticsCsvExportRequestSchema = GetSurveyAnalyticsQuerySchema.extend({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const SurveyCsvExportResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'CSVを作成しました' }),
    filename: z.string().openapi({ example: 'survey-responses-20260611.csv' }),
    csv: z.string().openapi({ description: 'CSV本文' }),
    row_count: z.number().int().nonnegative().openapi({ description: '出力件数' }),
  })
  .openapi({
    title: 'SurveyCsvExportResponse',
    description: 'CSV出力レスポンス',
  });

export type SurveyResponseStatus = z.infer<typeof SurveyResponseStatusSchema>;
export type SurveyResponseAnswer = z.infer<typeof SurveyResponseAnswerSchema>;
export type SurveyResponseListItem = z.infer<typeof SurveyResponseListItemSchema>;
export type GetSurveyResponsesQuery = z.infer<typeof GetSurveyResponsesQuerySchema>;
export type GetSurveyResponsesResponse = z.infer<typeof GetSurveyResponsesResponseSchema>;
export type SurveyResponseDetail = z.infer<typeof SurveyResponseDetailSchema>;
export type GetSurveyResponseDetailResponse = z.infer<typeof GetSurveyResponseDetailResponseSchema>;
export type SurveyAnalyticsChoiceStat = z.infer<typeof SurveyAnalyticsChoiceStatSchema>;
export type SurveyAnalyticsFreeTextSample = z.infer<typeof SurveyAnalyticsFreeTextSampleSchema>;
export type SurveyAnalyticsQuestion = z.infer<typeof SurveyAnalyticsQuestionSchema>;
export type SurveyAnalyticsContext = z.infer<typeof SurveyAnalyticsContextSchema>;
export type SurveyAnalyticsKpi = z.infer<typeof SurveyAnalyticsKpiSchema>;
export type GetSurveyAnalyticsQuery = z.infer<typeof GetSurveyAnalyticsQuerySchema>;
export type GetSurveyAnalyticsResponse = z.infer<typeof GetSurveyAnalyticsResponseSchema>;
export type SurveyCsvExportRequest = z.infer<typeof SurveyCsvExportRequestSchema>;
export type SurveyAnalyticsCsvExportRequest = z.infer<typeof SurveyAnalyticsCsvExportRequestSchema>;
export type SurveyCsvExportResponse = z.infer<typeof SurveyCsvExportResponseSchema>;
