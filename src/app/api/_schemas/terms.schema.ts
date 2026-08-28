import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const TermsTypeSchema = z
  .enum(['membership', 'privacy_policy', 'payment', 'companion', 'withdrawal', 'leave_of_absence'])
  .openapi({
    title: 'TermsType',
    description:
      '規約タイプ: membership=会員規約, privacy_policy=プライバシーポリシー, payment=決済規約, companion=同伴規約, withdrawal=退会規約, leave_of_absence=休会規約',
  });

export const TermsBrandSchema = z.enum(['joyfit', 'fit365']).openapi({
  title: 'TermsBrand',
  description: '対象ブランド (Y-04は2ブランド共通スコープ)',
});

export const TermsStatusSchema = z.enum(['published', 'expired', 'draft']).openapi({
  title: 'TermsStatus',
  description: 'ステータス (現在時刻から自動算出、保存されない)',
});

// -- Row schema --

export const TermsSchema = z
  .object({
    id: z.string().openapi({ example: 'TM-001', description: '規約ID' }),
    parent_terms_id: z
      .string()
      .nullable()
      .openapi({ description: 'ルート（オリジナル）規約のID。オリジナル自身ではnull' }),
    prev_terms_id: z
      .string()
      .nullable()
      .openapi({ description: '直前バージョンのID。オリジナル自身ではnull' }),
    terms_type: TermsTypeSchema,
    brand_enum: TermsBrandSchema,
    title: z.string().openapi({ description: '規約名' }),
    version: z.string().openapi({ example: 'v1.0', description: 'バージョンラベル' }),
    pdf_url: z.string().openapi({ description: 'PDFファイルURL' }),
    pdf_file_name: z.string().openapi({ description: 'PDFファイル名' }),
    pdf_file_size: z.number().openapi({ description: 'PDFファイルサイズ (bytes)' }),
    body_text: z.string().openapi({ description: '抽出された規約本文テキスト' }),
    effective_from: z.string().openapi({ example: '2026-04-01', description: '適用開始日' }),
    effective_to: z.string().nullable().openapi({ description: '適用終了予定日' }),
    display_order: z.number().nullable().openapi({ description: '表示順' }),
    requires_consent: z.boolean().openapi({ description: '承諾ボタン表示' }),
    remarks: z.string().nullable().openapi({ description: '備考 (バージョン履歴では変更概要)' }),
    is_deleted: z.boolean().openapi({ description: '論理削除フラグ' }),
    created_by: z.string().openapi({ description: '登録者名' }),
    updated_by: z.string().openapi({ description: '最終更新者名' }),
    created_at: z.string().openapi({ description: '作成日時 (ISO 8601)' }),
    updated_at: z.string().openapi({ description: '最終更新日時 (ISO 8601)' }),
  })
  .openapi({
    title: 'Terms',
    description: '規約文書情報 (1行 = 1バージョン)',
  });

// -- Request schemas --

export const GetTermsQuerySchema = z
  .object({
    termsType: TermsTypeSchema.optional(),
    brandEnum: TermsBrandSchema.optional(),
    status: TermsStatusSchema.optional(),
    query: z.string().optional().openapi({ description: 'ID・規約名部分一致検索' }),
    includeDeleted: z
      .preprocess((value) => value === 'true' || value === true, z.boolean())
      .optional()
      .default(false),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .refine(
        (value) => [25, 50, 100, 200].includes(value),
        'limit must be one of 25, 50, 100, 200',
      )
      .default(50),
  })
  .openapi({
    title: 'GetTermsQuery',
    description: '規約文書一覧取得クエリ',
  });

export const CreateTermsBodySchema = z
  .object({
    termsType: TermsTypeSchema,
    brandEnum: TermsBrandSchema,
    title: z.string().min(1, '規約名は必須です。'),
    version: z.string().min(1, 'バージョンは必須です。'),
    effectiveFrom: z.string().min(1, '適用開始日は必須です。'),
    effectiveTo: z.string().nullable().optional(),
    displayOrder: z.number().int().min(1).nullable().optional(),
    requiresConsent: z.boolean(),
    remarks: z.string().nullable().optional(),
    pdfUrl: z.string().min(1, 'PDFファイルは必須です。'),
    pdfFileName: z.string().min(1),
    pdfFileSize: z.number(),
    parentTermsId: z.string().nullable().optional(),
    prevTermsId: z.string().nullable().optional(),
  })
  .refine(
    (data) => !data.effectiveTo || new Date(data.effectiveTo) > new Date(data.effectiveFrom),
    {
      message: '適用終了予定日は適用開始日より後の日付を入力してください。',
      path: ['effectiveTo'],
    },
  )
  .openapi({
    title: 'CreateTermsBody',
    description: '規約文書作成リクエスト',
  });

// `termsType`/`brandEnum` are intentionally absent — immutable after creation (FR-012).
export const UpdateTermsBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    effectiveFrom: z.string().min(1).optional(),
    effectiveTo: z.string().nullable().optional(),
    displayOrder: z.number().int().min(1).nullable().optional(),
    requiresConsent: z.boolean().optional(),
    remarks: z.string().nullable().optional(),
    pdfUrl: z.string().min(1).optional(),
    pdfFileName: z.string().min(1).optional(),
    pdfFileSize: z.number().optional(),
  })
  .refine(
    (data) => {
      const provided = [data.pdfUrl, data.pdfFileName, data.pdfFileSize].filter(
        (value) => value !== undefined,
      );
      return provided.length === 0 || provided.length === 3;
    },
    {
      message: 'PDFファイル情報 (pdfUrl/pdfFileName/pdfFileSize) はすべて指定してください。',
      path: ['pdfUrl'],
    },
  )
  .openapi({
    title: 'UpdateTermsBody',
    description: '規約文書更新リクエスト (termsType/brandEnumは作成後変更不可)',
  });

// -- Response schemas --

export const TermsListItemResponseSchema = z
  .object({
    id: TermsSchema.shape.id,
    termsType: TermsSchema.shape.terms_type,
    brandEnum: TermsSchema.shape.brand_enum,
    title: TermsSchema.shape.title,
    version: TermsSchema.shape.version,
    effectiveFrom: TermsSchema.shape.effective_from,
    displayOrder: TermsSchema.shape.display_order,
    status: TermsStatusSchema.openapi({ description: '算出されたステータス' }),
    isDeleted: TermsSchema.shape.is_deleted,
  })
  .openapi({
    title: 'TermsListItemResponse',
    description: '規約文書一覧アイテム',
  });

export const TermsVersionEntrySchema = z
  .object({
    id: TermsSchema.shape.id,
    version: TermsSchema.shape.version,
    versionKind: z
      .enum(['original', 'version'])
      .openapi({ description: 'original=オリジナル規約, version=バージョン規約' }),
    status: TermsStatusSchema,
    effectiveFrom: TermsSchema.shape.effective_from,
    effectiveTo: TermsSchema.shape.effective_to,
    changeSummary: TermsSchema.shape.remarks,
    isCurrentlyApplied: z.boolean(),
    pdfUrl: TermsSchema.shape.pdf_url.optional(),
    pdfFileName: TermsSchema.shape.pdf_file_name.optional(),
    pdfFileSize: TermsSchema.shape.pdf_file_size.optional(),
  })
  .openapi({
    title: 'TermsVersionEntry',
    description: 'バージョン履歴の1エントリ (現行適用中エントリのみpdfUrl/pdfFileNameを含む)',
  });

export const TermsDetailResponseSchema = z
  .object({
    id: TermsSchema.shape.id,
    parentTermsId: TermsSchema.shape.parent_terms_id,
    prevTermsId: TermsSchema.shape.prev_terms_id,
    termsType: TermsSchema.shape.terms_type,
    brandEnum: TermsSchema.shape.brand_enum,
    title: TermsSchema.shape.title,
    version: TermsSchema.shape.version,
    pdfUrl: TermsSchema.shape.pdf_url,
    pdfFileName: TermsSchema.shape.pdf_file_name,
    pdfFileSize: TermsSchema.shape.pdf_file_size,
    bodyText: TermsSchema.shape.body_text,
    effectiveFrom: TermsSchema.shape.effective_from,
    effectiveTo: TermsSchema.shape.effective_to,
    displayOrder: TermsSchema.shape.display_order,
    requiresConsent: TermsSchema.shape.requires_consent,
    remarks: TermsSchema.shape.remarks,
    isDeleted: TermsSchema.shape.is_deleted,
    createdBy: TermsSchema.shape.created_by,
    updatedBy: TermsSchema.shape.updated_by,
    createdAt: TermsSchema.shape.created_at,
    updatedAt: TermsSchema.shape.updated_at,
    status: TermsStatusSchema,
    versionKind: z.enum(['original', 'version']),
    isCurrentlyApplied: z.boolean(),
    relatedTermsRef: z
      .object({ id: z.string(), title: z.string(), version: z.string() })
      .nullable()
      .openapi({ description: '関連規約 (オリジナル/派生元の参照)。ない場合はnull' }),
    versions: z
      .array(TermsVersionEntrySchema)
      .openapi({ description: 'ライン全体のバージョン履歴 (適用開始日昇順)' }),
  })
  .openapi({
    title: 'TermsDetailResponse',
    description: '規約文書詳細情報',
  });

export const GetTermsResponseSchema = z
  .object({
    items: z.array(TermsListItemResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalAllItems: z.number().openapi({ description: '絞り込み前の全件数' }),
      totalPages: z.number(),
    }),
  })
  .openapi({
    title: 'GetTermsResponse',
    description: '規約文書一覧レスポンス',
  });

export const CreateTermsResponseSchema = TermsDetailResponseSchema.openapi({
  title: 'CreateTermsResponse',
  description: '規約文書作成レスポンス',
});

export const UpdateTermsResponseSchema = TermsDetailResponseSchema.openapi({
  title: 'UpdateTermsResponse',
  description: '規約文書更新レスポンス',
});

export const DeleteTermsResponseSchema = z
  .object({
    message: z.string().openapi({ example: '規約を削除しました' }),
  })
  .openapi({
    title: 'DeleteTermsResponse',
    description: '規約文書削除レスポンス',
  });

// -- Type exports --

export type TermsType = z.infer<typeof TermsTypeSchema>;
export type TermsBrand = z.infer<typeof TermsBrandSchema>;
export type TermsStatus = z.infer<typeof TermsStatusSchema>;
export type Terms = z.infer<typeof TermsSchema>;
export type GetTermsQuery = z.infer<typeof GetTermsQuerySchema>;
export type CreateTermsBody = z.infer<typeof CreateTermsBodySchema>;
export type UpdateTermsBody = z.infer<typeof UpdateTermsBodySchema>;
export type TermsListItemResponse = z.infer<typeof TermsListItemResponseSchema>;
export type TermsVersionEntry = z.infer<typeof TermsVersionEntrySchema>;
export type TermsDetailResponse = z.infer<typeof TermsDetailResponseSchema>;
