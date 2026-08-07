import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Enum Schemas ────────────────────────────────────────────────────────────

export const BlacklistRegistrationSourceSchema = z.enum(['forced_withdrawal', 'manual']).openapi({
  title: 'BlacklistRegistrationSource',
  description:
    'How the member was added to the blacklist: forced_withdrawal=強制退会, manual=手動登録',
});

export const BlacklistManualReasonSchema = z
  .enum(['nuisance', 'unpaid', 'fraudulent_use', 'other'])
  .openapi({
    title: 'BlacklistManualReason',
    description:
      'Reason for manual blacklist registration: nuisance=迷惑行為, unpaid=未納金, fraudulent_use=不正利用, other=その他',
  });

export const UnpaidFilterSchema = z.enum(['has_debt', 'no_debt']).openapi({
  title: 'UnpaidFilter',
  description: 'Unpaid amount filter: has_debt=未納金あり, no_debt=未納金なし',
});

// ─── Item Schema ──────────────────────────────────────────────────────────────

export const BlacklistItemSchema = z
  .object({
    id: z.string().openapi({ example: 'BL-FW-001', description: 'ブラックリストID' }),
    memberId: z.string().openapi({ example: 'USR-00123', description: '会員番号' }),
    memberName: z.string().openapi({ example: '田中 太郎', description: '会員氏名' }),
    storeName: z.string().openapi({ example: 'JOYFIT24新宿店', description: '店舗名' }),
    registrationSource: BlacklistRegistrationSourceSchema,
    manualReason: BlacklistManualReasonSchema.nullable().openapi({
      description: '手動登録理由（forced_withdrawalの場合はnull）',
    }),
    unpaidAmount: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 9900, description: '未納金額（円）' }),
    registeredAt: z
      .string()
      .openapi({ example: '2026-01-15T09:00:00.000Z', description: '登録日時（ISO 8601）' }),
    memo: z.string().nullable().openapi({ description: 'メモ' }),
  })
  .openapi({ title: 'BlacklistItem' });

export type BlacklistItem = z.infer<typeof BlacklistItemSchema>;

// ─── Query Schema ─────────────────────────────────────────────────────────────

export const GetBlacklistQuerySchema = z
  .object({
    search: z
      .string()
      .optional()
      .openapi({ example: 'USR-00123', description: '会員番号・氏名で検索' }),
    reason: BlacklistRegistrationSourceSchema.optional().openapi({
      description: '登録理由フィルター',
    }),
    unpaid: UnpaidFilterSchema.optional().openapi({ description: '未納金フィルター' }),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1))
      .openapi({ example: '1', description: 'ページ番号' }),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20))
      .pipe(z.number().int().min(1).max(100))
      .openapi({ example: '20', description: '1ページあたりの件数' }),
  })
  .openapi({ title: 'GetBlacklistQuery' });

export type GetBlacklistQuery = z.infer<typeof GetBlacklistQuerySchema>;

// ─── Response Schema ──────────────────────────────────────────────────────────

export const GetBlacklistResponseSchema = z
  .object({
    blacklist: z.array(BlacklistItemSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      total_pages: z.number().int(),
    }),
  })
  .openapi({ title: 'GetBlacklistResponse' });

export type GetBlacklistResponse = z.infer<typeof GetBlacklistResponseSchema>;

// ─── POST Body Schema ─────────────────────────────────────────────────────────

export const PostBlacklistBodySchema = z
  .object({
    memberId: z.string().min(1).openapi({ example: 'USR-00456', description: '会員番号' }),
    memberName: z.string().min(1).openapi({ example: '山田 花子', description: '会員氏名' }),
    storeName: z
      .string()
      .optional()
      .openapi({ example: 'JOYFIT渋谷店', description: '店舗名（任意）' }),
    reason: BlacklistManualReasonSchema.openapi({ description: '登録理由' }),
    memo: z.string().optional().openapi({ description: 'メモ（任意）' }),
  })
  .openapi({ title: 'PostBlacklistBody' });

export type PostBlacklistBody = z.infer<typeof PostBlacklistBodySchema>;

export const PostBlacklistResponseSchema = z
  .object({
    blacklist: BlacklistItemSchema,
  })
  .openapi({ title: 'PostBlacklistResponse' });

export type PostBlacklistResponse = z.infer<typeof PostBlacklistResponseSchema>;

// ─── Detail Schemas ───────────────────────────────────────────────────────────

export const MatchConditionsSchema = z
  .object({
    nameAndBirthdate: z.boolean().openapi({ description: '氏名＆生年月日一致' }),
    email: z.boolean().openapi({ description: 'メール一致' }),
    phone: z.boolean().openapi({ description: '電話一致' }),
    address: z.boolean().openapi({ description: '住所一致' }),
  })
  .openapi({ title: 'MatchConditions' });

export type MatchConditions = z.infer<typeof MatchConditionsSchema>;

export const BlacklistDetailSchema = BlacklistItemSchema.extend({
  registeredBy: z.string().openapi({ example: '佐藤 花子', description: '登録者名' }),
  matchConditions: MatchConditionsSchema,
}).openapi({ title: 'BlacklistDetail' });

export type BlacklistDetail = z.infer<typeof BlacklistDetailSchema>;

export const GetBlacklistByIdResponseSchema = z
  .object({
    blacklist: BlacklistDetailSchema,
  })
  .openapi({ title: 'GetBlacklistByIdResponse' });

export type GetBlacklistByIdResponse = z.infer<typeof GetBlacklistByIdResponseSchema>;

// ─── Error Schema ─────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi({ title: 'BlacklistErrorResponse' });
