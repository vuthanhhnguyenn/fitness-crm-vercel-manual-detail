import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Query-string booleans arrive as `'true'` / `'false'`. An absent or empty value
 * stays `undefined` so the caller's own default applies.
 */
function booleanQuery(description: string, defaultValue?: boolean) {
  return z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return defaultValue;
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return defaultValue;
  }, z.boolean().optional().openapi({ description }));
}

// ─── Enum Schemas ────────────────────────────────────────────────────────────

/**
 * v0.4 — *how* the entry was created. This is the registration-path axis, and it is
 * what the list's 登録理由 column and filter show. Distinct from
 * `BlacklistReasonCategory`, which is *why* (spec § Backend API Contract Mapping).
 */
export const BlacklistSourceSchema = z.enum(['forced_withdrawal', 'manual']).openapi({
  title: 'BlacklistSource',
  description: '登録経路: forced_withdrawal=強制退会（システム自動）, manual=手動登録（本部）',
});

/**
 * v0.4 — *why* the entry exists. Written by the registration form and stored, but
 * displayed by no screen (FR-043a / spec Q-03).
 *
 * `equipment_damage` is never offered by the form — it exists only because migrated
 * legacy rows carry it, and renderers must still handle it.
 */
export const BlacklistReasonCategorySchema = z
  .enum(['unpaid', 'equipment_damage', 'nuisance', 'fraudulent_use', 'other'])
  .openapi({
    title: 'BlacklistReasonCategory',
    description:
      '登録理由カテゴリ: unpaid=未納金, equipment_damage=設備破損（移行データのみ・フォーム非表示）, nuisance=迷惑行為, fraudulent_use=不正利用, other=その他',
  });

export type BlacklistSource = z.infer<typeof BlacklistSourceSchema>;
export type BlacklistReasonCategory = z.infer<typeof BlacklistReasonCategorySchema>;

export const BlacklistHistoryEventSchema = z.enum(['registered', 'removed']).openapi({
  title: 'BlacklistHistoryEvent',
  description: '履歴イベント: registered=登録, removed=解除',
});

export const UnpaidFilterSchema = z.enum(['has_unpaid', 'no_unpaid']).openapi({
  title: 'UnpaidFilter',
  description: '未納金フィルター: has_unpaid=あり, no_unpaid=なし',
});

// ─── Shared Refs ─────────────────────────────────────────────────────────────

export const BlacklistStaffRefSchema = z
  .object({
    staff_id: z.string().openapi({ example: 'stf-001', description: 'スタッフID' }),
    display_name: z.string().openapi({ example: '佐藤 花子', description: '表示名' }),
  })
  .openapi({ title: 'BlacklistStaffRef' });

export type BlacklistStaffRef = z.infer<typeof BlacklistStaffRefSchema>;

// ─── List Item ───────────────────────────────────────────────────────────────

/**
 * One row of the blacklist list. Member fields are flattened here and nested on the
 * detail, matching how A-03 splits `LeaveListItem` from `LeaveMember`.
 */
export const BlacklistListItemSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: 'bl-0001', description: 'ブラックリストID（表示しない・遷移用）' }),
    member_id: z
      .string()
      .openapi({ example: 'mem-00101', description: '会員レコードID（表示しない・遷移用）' }),
    member_number: z
      .string()
      .openapi({ example: 'JF-0000101', description: '会員番号（画面に表示する会員ID）' }),
    member_name: z.string().openapi({ example: '田中 次郎', description: '会員氏名' }),
    store_name: z.string().nullable().openapi({
      example: 'JOYFIT渋谷店',
      description: '所属店舗名（未所属はnull → 画面はダッシュ表示）',
    }),
    source: BlacklistSourceSchema,
    /**
     * v0.4 — never null. Auto-registered rows carry exactly `['unpaid']`; migrated
     * legacy rows without a recorded reason carry `[]`, so no consumer may assume a
     * first element exists.
     */
    reason_categories: z.array(BlacklistReasonCategorySchema).openapi({
      example: ['unpaid'],
      description: '登録理由カテゴリ（画面には表示しない・FR-043a）',
    }),
    /**
     * Live arrears, summed per request rather than stored on the entry. Always an
     * integer, never null — `0` when nothing is outstanding (FR-011).
     */
    unpaid_amount: z.number().int().nonnegative().openapi({
      example: 15400,
      description: '未納金額（円）。0のときも必ず数値',
    }),
    is_active: z
      .boolean()
      .openapi({ example: true, description: '有効なBL登録か（解除済みはfalse）' }),
    registered_at: z
      .string()
      .openapi({ example: '2026-01-15T10:30:00.000Z', description: '登録日時（ISO 8601）' }),
  })
  .openapi({ title: 'BlacklistListItem' });

export type BlacklistListItem = z.infer<typeof BlacklistListItemSchema>;

// ─── Query ───────────────────────────────────────────────────────────────────

export const GetBlacklistQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1))
      .openapi({ example: '1', description: 'ページ番号' }),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 25))
      .pipe(z.number().int().min(1).max(100))
      .openapi({ example: '25', description: '1ページあたりの件数（最大100）' }),
    search: z.string().max(60).optional().openapi({
      example: 'JF-0000101',
      description: '会員ID・氏名で検索（サーバー側で全件評価）',
    }),
    source: BlacklistSourceSchema.optional().openapi({
      description: '登録理由（登録経路）フィルター',
    }),
    unpaid: UnpaidFilterSchema.optional().openapi({ description: '未納金フィルター' }),
    /**
     * FR-033 — defaults to `true` and no screen control changes it (spec Q-07).
     * Released entries are reachable only by their own URL.
     */
    is_active: booleanQuery('有効なBL登録のみ返す（既定true）', true),
    include_total_all: booleanQuery('絞り込み前の母数（total_all）を返すか（既定false）', false),
  })
  .openapi({ title: 'GetBlacklistQuery' });

export type GetBlacklistQuery = z.infer<typeof GetBlacklistQuerySchema>;

export const GetBlacklistResponseSchema = z
  .object({
    blacklist: z.array(BlacklistListItemSchema),
    total: z.number().openapi({ example: 12, description: '絞り込み後の件数' }),
    /**
     * FR-025 — the banner's denominator: the count with every optional filter reset,
     * i.e. what 条件をクリア would show. `is_active` still applies, so this counts
     * active entries only. Absent unless `include_total_all=true`.
     */
    total_all: z.number().optional().openapi({
      example: 34,
      description: '絞り込み前の母数（include_total_all=true のときのみ）',
    }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 25 }),
    total_pages: z.number().openapi({ example: 2 }),
  })
  .openapi({ title: 'GetBlacklistResponse' });

export type GetBlacklistResponse = z.infer<typeof GetBlacklistResponseSchema>;

// ─── Detail ──────────────────────────────────────────────────────────────────

/** Widened member block for the detail head-up card (confirmed inline by the client, QA qa07). */
export const BlacklistMemberSchema = z
  .object({
    member_id: z.string().openapi({ example: 'mem-00101', description: '会員レコードID' }),
    member_number: z.string().openapi({ example: 'JF-0000101', description: '会員番号' }),
    name: z.string().openapi({ example: '田中 次郎', description: '氏名' }),
    name_kana: z.string().nullable().openapi({ example: 'タナカ ジロウ', description: '氏名カナ' }),
    legacy_member_code: z
      .string()
      .nullable()
      .openapi({ example: 'JF-19872', description: '旧会員No（新規会員はnull → 画面は非表示）' }),
    member_type: z.string().nullable().openapi({ example: '通常会員', description: '会員種別' }),
    /**
     * Null once a forced-withdrawal contract closes — which is the normal case for this
     * screen's population, so the 主契約 badge is omitted rather than rendered blank.
     */
    contract_name: z
      .string()
      .nullable()
      .openapi({ example: 'レギュラー会員', description: '主契約名（契約終了後はnull）' }),
    store_name: z
      .string()
      .nullable()
      .openapi({ example: 'JOYFIT渋谷店', description: '所属店舗名' }),
    face_photo_url: z.string().nullable().openapi({ description: '顔写真URL' }),
  })
  .openapi({ title: 'BlacklistMember' });

export type BlacklistMember = z.infer<typeof BlacklistMemberSchema>;

/**
 * Seed-only. Rendered by no Phase 1 surface (FR-072 / spec Q-06), but the contract
 * declares it required, so the mock returns it to stay equivalent to the real endpoint.
 */
export const BlacklistHistoryEntrySchema = z
  .object({
    event: BlacklistHistoryEventSchema,
    occurred_at: z
      .string()
      .openapi({ example: '2026-01-15T10:30:00.000Z', description: '発生日時（ISO 8601）' }),
    actor: BlacklistStaffRefSchema.nullable().openapi({
      description: '実行者。システム自動登録の場合はnull',
    }),
    source: BlacklistSourceSchema.openapi({ description: 'イベント時点の登録経路' }),
  })
  .openapi({ title: 'BlacklistHistoryEntry' });

export type BlacklistHistoryEntry = z.infer<typeof BlacklistHistoryEntrySchema>;

export const BlacklistDetailSchema = BlacklistListItemSchema.extend({
  member: BlacklistMemberSchema,
  /**
   * v0.4 semantic change — this is the screen's 「メモ」, optional. Up to v0.3 the same
   * slot was a required free-text 登録理由; the reason axis now lives in
   * `reason_categories`. Code reading this as 登録理由 is stale.
   */
  memo: z.string().nullable().openapi({ description: 'メモ（補足・任意）' }),
  level: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable()
    .openapi({ description: 'BLレベル（定義未確定・常にnull → 未分類）' }),
  registered_by: BlacklistStaffRefSchema,
  removed_at: z.string().nullable().openapi({ description: '解除日時。有効な登録の間はnull' }),
  removed_by: BlacklistStaffRefSchema.nullable().openapi({
    description: '解除者。有効な登録の間はnull',
  }),
  history: z.array(BlacklistHistoryEntrySchema).openapi({
    description: '登録・解除イベント（occurred_at 昇順）。シードのみ・画面には表示しない',
  }),
}).openapi({ title: 'BlacklistDetail' });

export type BlacklistDetail = z.infer<typeof BlacklistDetailSchema>;

export const GetBlacklistByIdResponseSchema = z
  .object({ blacklist: BlacklistDetailSchema })
  .openapi({ title: 'GetBlacklistByIdResponse' });

export type GetBlacklistByIdResponse = z.infer<typeof GetBlacklistByIdResponseSchema>;

// ─── Register (member-scoped) ────────────────────────────────────────────────

/**
 * `source` is deliberately absent: every entry created through this endpoint is written
 * as `manual` server-side. `forced_withdrawal` is reachable only from the
 * forced-withdrawal path (FR-049).
 */
export const CreateBlacklistBodySchema = z
  .object({
    reason_categories: z
      .array(BlacklistReasonCategorySchema)
      .min(1, '登録理由は必須です')
      .max(5)
      .refine((v) => new Set(v).size === v.length, '登録理由が重複しています')
      .openapi({ example: ['nuisance'], description: '登録理由カテゴリ（1件以上）' }),
    memo: z.string().max(2000).nullish().openapi({ description: 'メモ（任意・最大2000文字）' }),
    level: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .openapi({ description: 'BLレベル（画面からは送らない）' }),
  })
  .openapi({ title: 'CreateBlacklistBody' });

export type CreateBlacklistBody = z.infer<typeof CreateBlacklistBodySchema>;

export const CreateBlacklistResponseSchema = z
  .object({ blacklist: BlacklistDetailSchema })
  .openapi({ title: 'CreateBlacklistResponse' });

export type CreateBlacklistResponse = z.infer<typeof CreateBlacklistResponseSchema>;

// ─── Release ─────────────────────────────────────────────────────────────────

/**
 * `false` only. Re-listing goes through the register endpoint, which creates a *fresh*
 * entry — reviving a released row would put two rows in contention for the
 * one-active-row invariant and erase the audit boundary between offences (FR-067).
 */
export const ReleaseBlacklistBodySchema = z
  .object({
    is_active: z.literal(false).openapi({
      example: false,
      description: 'false のみ受け付ける。再登録は登録APIで新規レコードを作る',
    }),
  })
  .openapi({ title: 'ReleaseBlacklistBody' });

export type ReleaseBlacklistBody = z.infer<typeof ReleaseBlacklistBodySchema>;

export const ReleaseBlacklistResponseSchema = z
  .object({ blacklist: BlacklistDetailSchema })
  .openapi({ title: 'ReleaseBlacklistResponse' });

export type ReleaseBlacklistResponse = z.infer<typeof ReleaseBlacklistResponseSchema>;

// ─── Error ───────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi({ title: 'BlacklistErrorResponse' });
