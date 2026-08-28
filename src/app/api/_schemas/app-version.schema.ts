import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// Y-05 uses a dedicated 2-value brand enum (top-level brand only — app builds
// are shared across sub-brands), distinct from the shared 5-value BrandEnumSchema.
export const AppVersionBrandEnumSchema = z.enum(['Joyfit', 'Fit365']).openapi({
  title: 'AppVersionBrandEnum',
  description: 'アプリ配信バージョン管理で扱うブランド（トップレベルブランドのみ）',
});

export const AppVersionSortSchema = z.enum(['releaseDate', 'createdAt']).openapi({
  title: 'AppVersionSortBy',
  description: 'アプリバージョン一覧ソートキー',
});

export const AppVersionRecordSchema = z
  .object({
    id: z.string().openapi({
      example: '01912d4e-7a3b-7c8d-9e0f-1a2b3c4d5e6f',
      description: 'アプリバージョンレコードID',
    }),
    brandEnum: AppVersionBrandEnumSchema,
    iosVersionName: z.string().openapi({ example: '2.1.0', description: 'iOSバージョン名' }),
    iosBuildNumber: z.number().int().openapi({ example: 210, description: 'iOSビルド番号' }),
    androidVersionName: z
      .string()
      .openapi({ example: '2.1.0', description: 'Androidバージョン名' }),
    androidBuildNumber: z
      .number()
      .int()
      .openapi({ example: 2100, description: 'Androidビルド番号' }),
    releaseDate: z.string().openapi({ example: '2026-04-15', description: 'リリース日' }),
    remarks: z.string().nullable().openapi({ example: 'Spring release', description: '備考' }),
    createdBy: z.string().openapi({ description: '作成者スタッフID' }),
    updatedBy: z.string().nullable().openapi({ description: '最終更新者スタッフID' }),
    createdAt: z.string().openapi({ description: '作成日時' }),
    updatedAt: z.string().nullable().openapi({ description: '更新日時' }),
  })
  .openapi({
    title: 'AppVersionRecord',
    description: 'アプリ配信バージョン管理レコード',
  });

export const GetAppVersionsQueryParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: AppVersionSortSchema.default('releaseDate'),
    order: z.enum(['asc', 'desc']).default('desc'),
    brandEnum: AppVersionBrandEnumSchema.nullable().optional(),
  })
  .openapi({
    title: 'GetAppVersionsQueryParams',
    description: 'アプリバージョン一覧取得クエリ',
  });

export const AppVersionPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export const GetAppVersionsResponseSchema = z
  .object({
    items: z.array(AppVersionRecordSchema),
    totalAllItems: z.number().openapi({ description: '全件数（フィルタ未適用）' }),
    pagination: AppVersionPaginationSchema,
  })
  .openapi({
    title: 'GetAppVersionsResponse',
    description: 'アプリバージョン一覧レスポンス',
  });

export const GetAppVersionResponseSchema = AppVersionRecordSchema.openapi({
  title: 'GetAppVersionResponse',
  description: 'アプリバージョン詳細レスポンス',
});

export const CreateAppVersionBodySchema = z
  .object({
    brandEnum: AppVersionBrandEnumSchema,
    iosVersionName: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .openapi({ example: '2.1.0' }),
    iosBuildNumber: z.number().int().min(1).openapi({ example: 210 }),
    androidVersionName: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .openapi({ example: '2.1.0' }),
    androidBuildNumber: z.number().int().min(1).openapi({ example: 2100 }),
    releaseDate: z.string().openapi({ example: '2026-04-15' }),
    remarks: z.string().max(1000).nullable().optional().openapi({ example: 'Spring release' }),
  })
  .openapi({ title: 'CreateAppVersionBody', description: 'アプリバージョン登録リクエスト' });

export const UpdateAppVersionBodySchema = CreateAppVersionBodySchema.partial().openapi({
  title: 'UpdateAppVersionBody',
  description: 'アプリバージョン更新リクエスト（全フィールド任意）',
});

export const ErrorResponseSchema = z
  .object({
    code: z.string().openapi({ description: 'エラーコード' }),
    message: z.string().openapi({ description: 'エラーメッセージ' }),
    userMessage: z.string().openapi({ description: 'ユーザー向けエラーメッセージ' }),
    traceId: z.string().optional().openapi({ description: 'トレースID（デバッグ用）' }),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'エラーレスポンス',
  });

export type AppVersionBrandEnum = z.infer<typeof AppVersionBrandEnumSchema>;
export type AppVersionRecord = z.infer<typeof AppVersionRecordSchema>;
export type GetAppVersionsQueryParams = z.infer<typeof GetAppVersionsQueryParamsSchema>;
export type CreateAppVersionBody = z.infer<typeof CreateAppVersionBodySchema>;
export type UpdateAppVersionBody = z.infer<typeof UpdateAppVersionBodySchema>;
