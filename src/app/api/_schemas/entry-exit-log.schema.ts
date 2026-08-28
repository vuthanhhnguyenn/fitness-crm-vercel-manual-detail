import { z } from 'zod';

import { GenderSchema } from './member.schema';

// ─── Shared enums ───────────────────────────────────────────────────────────

export const EntryExitDirectionSchema = z.enum(['entry', 'exit']);
export type EntryExitDirection = z.infer<typeof EntryExitDirectionSchema>;

export const FrequencyBadgeSchema = z.enum(['regular', 'longAbsence']).nullable();
export type FrequencyBadge = z.infer<typeof FrequencyBadgeSchema>;

export const CompanionRoleSchema = z.enum(['inviter', 'invitee']).nullable();
export type CompanionRole = z.infer<typeof CompanionRoleSchema>;

export const AuthMethodSchema = z.enum(['qr', 'nfc']);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

export const EntryExitResultSchema = z.enum(['success', 'denied']);
export type EntryExitResult = z.infer<typeof EntryExitResultSchema>;

/**
 * Quick View's own status vocabulary — decoupled from `EntryExitDirectionSchema`
 * (still used unchanged by `GetEntryExitLogsQuerySchema.direction`, feature 013's
 * activity feed) so B-01-01's in-progress/denied visits can be labeled accurately
 * without affecting feature 013's existing 'entry'/'exit' usage.
 */
export const QuickViewContextSchema = z.enum(['entry', 'exit', 'in-building', 'denied']);
export type QuickViewContext = z.infer<typeof QuickViewContextSchema>;

// ─── GET /crm/entry-exit-logs ───────────────────────────────────────────────

export const ActivityRowSchema = z.object({
  log_id: z.string().openapi({ example: 'EEL-000123', description: 'Entry-exit log row id' }),
  member_id: z.string().openapi({ example: 'M-00001' }),
  name: z.string().openapi({ example: '伊藤健太' }),
  furigana: z.string().openapi({ example: 'イトウ ケンタ' }),
  gender: GenderSchema,
  avatar_url: z.string().nullable().openapi({ example: '/avatars/14.jpg' }),
  contract_name: z.string().openapi({ example: 'プレミアムクレジット会員(相互利用あり)' }),
  contract_id: z.string().openapi({ example: '3750009251' }),
  occurred_at: z.string().openapi({ example: '2026-07-07T13:35:00.000Z' }),
  gate: z.string().openapi({ example: 'ゲートA' }),
  frequency_badge: FrequencyBadgeSchema,
  companion_role: CompanionRoleSchema,
  visit_count: z.number().int().nonnegative().openapi({ example: 203 }),
});
export type ActivityRow = z.infer<typeof ActivityRowSchema>;

export const GetEntryExitLogsQuerySchema = z.object({
  direction: EntryExitDirectionSchema.openapi({ description: 'Which activity table to fetch' }),
  limit: z.coerce.number().int().min(1).max(50).default(5).openapi({ example: 5 }),
  date: z.string().optional().openapi({
    example: '2026-07-07',
    description: 'ISO date (YYYY-MM-DD); defaults to today when omitted',
  }),
  store_id: z.string().optional().openapi({
    example: 'all',
    description: 'Store id to scope results to; omitted or "all" returns all accessible stores',
  }),
});
export type GetEntryExitLogsQuery = z.infer<typeof GetEntryExitLogsQuerySchema>;

export const GetEntryExitLogsResponseSchema = z.object({
  data: z.array(ActivityRowSchema),
});
export type GetEntryExitLogsResponse = z.infer<typeof GetEntryExitLogsResponseSchema>;

// ─── GET /crm/entry-exit-logs/hourly-summary ────────────────────────────────

export const HourlyEntryCountSchema = z.object({
  hour: z.number().int().min(6).max(22).openapi({ example: 9 }),
  count: z.number().int().nonnegative().openapi({ example: 12 }),
});
export type HourlyEntryCount = z.infer<typeof HourlyEntryCountSchema>;

export const GetEntryExitHourlySummaryQuerySchema = z.object({
  date: z.string().optional().openapi({ example: '2026-07-07' }),
  store_id: z.string().optional().openapi({ example: 'all' }),
});
export type GetEntryExitHourlySummaryQuery = z.infer<typeof GetEntryExitHourlySummaryQuerySchema>;

export const GetEntryExitHourlySummaryResponseSchema = z.object({
  data: z.array(HourlyEntryCountSchema),
});
export type GetEntryExitHourlySummaryResponse = z.infer<
  typeof GetEntryExitHourlySummaryResponseSchema
>;

// ─── GET /crm/entry-exit-logs/{id}/quick-view ───────────────────────────────

export const RecentVisitSchema = z.object({
  exit_occurred_at: z.string().openapi({ example: '2026-11-01T12:20:00.000Z' }),
  duration_minutes: z.number().int().nonnegative().nullable().openapi({ example: 105 }),
  store_name: z.string().openapi({ example: 'JOYFIT24新宿店' }),
});
export type RecentVisit = z.infer<typeof RecentVisitSchema>;

export const MemberQuickViewSchema = z.object({
  member_id: z.string(),
  name: z.string(),
  furigana: z.string(),
  gender: GenderSchema,
  avatar_url: z.string().nullable(),
  context: QuickViewContextSchema,
  occurred_at: z.string(),
  contract_name: z.string(),
  contract_id: z.string(),
  frequency_badge: FrequencyBadgeSchema,
  companion_role: CompanionRoleSchema,
  phone: z.string().nullable(),
  email: z.string().nullable(),
  recent_visits: z.array(RecentVisitSchema).max(3),
});
export type MemberQuickView = z.infer<typeof MemberQuickViewSchema>;

export const GetEntryExitLogQuickViewResponseSchema = z.object({
  data: MemberQuickViewSchema,
});
export type GetEntryExitLogQuickViewResponse = z.infer<
  typeof GetEntryExitLogQuickViewResponseSchema
>;

// ─── GET /crm/entry-exit-logs/history (B-01-01) ─────────────────────────────

export const VisitStatusSchema = z.enum(['completed', 'in_progress', 'denied']);
export type VisitStatus = z.infer<typeof VisitStatusSchema>;

export const HistorySortBySchema = z.enum([
  'name',
  'visit_date',
  'entry_time',
  'exit_time',
  'contract_name',
]);
export type HistorySortBy = z.infer<typeof HistorySortBySchema>;

export const HistoryVisitRowSchema = z.object({
  entry_log_id: z.string().openapi({ example: 'EEL-000201' }),
  exit_log_id: z.string().nullable().openapi({ example: 'EEL-000202' }),
  member_id: z.string().openapi({ example: 'M-00001' }),
  name: z.string().openapi({ example: '田中太郎' }),
  furigana: z.string().openapi({ example: 'タナカタロウ' }),
  gender: GenderSchema,
  avatar_url: z.string().nullable().openapi({ example: '/avatars/3.jpg' }),
  contract_name: z.string().openapi({ example: 'フィットネスクレジット会員(相互利用あり)' }),
  contract_id: z.string().openapi({ example: '3750008421' }),
  visit_date: z.string().openapi({ example: '2026-11-30' }),
  entry_time: z.string().openapi({ example: '2026-11-30T09:05:00.000Z' }),
  exit_time: z.string().nullable().openapi({ example: '2026-11-30T10:32:00.000Z' }),
  stay_duration_minutes: z.number().int().nonnegative().nullable().openapi({ example: 87 }),
  visit_status: VisitStatusSchema,
  home_store_id: z.string().openapi({ example: 'store-001' }),
  home_store_name: z.string().openapi({ example: 'FIT365八潮店' }),
  visit_store_id: z.string().openapi({ example: 'store-001' }),
  visit_store_name: z.string().openapi({ example: 'FIT365八潮店' }),
  auth_method: AuthMethodSchema,
  result: EntryExitResultSchema,
});
export type HistoryVisitRow = z.infer<typeof HistoryVisitRowSchema>;

export const HistoryPaginationSchema = z.object({
  page: z.number().int().min(1).openapi({ example: 1 }),
  limit: z.number().int().min(1).openapi({ example: 30 }),
  total: z.number().int().nonnegative().openapi({ example: 247 }),
  total_pages: z.number().int().nonnegative().openapi({ example: 9 }),
});
export type HistoryPagination = z.infer<typeof HistoryPaginationSchema>;

export const GetEntryExitHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
  search: z.string().optional().openapi({ description: 'Matches member name or member ID' }),
  date_from: z.string().optional().openapi({ example: '2026-11-01' }),
  date_to: z.string().optional().openapi({ example: '2026-11-30' }),
  store_id: z.string().optional().openapi({ description: 'Visiting-store filter' }),
  auth_method: AuthMethodSchema.optional(),
  result: EntryExitResultSchema.optional(),
  sort_by: HistorySortBySchema.default('visit_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
export type GetEntryExitHistoryQuery = z.infer<typeof GetEntryExitHistoryQuerySchema>;

export const GetEntryExitHistoryResponseSchema = z.object({
  history: z.array(HistoryVisitRowSchema),
  pagination: HistoryPaginationSchema,
});
export type GetEntryExitHistoryResponse = z.infer<typeof GetEntryExitHistoryResponseSchema>;

// ─── POST /crm/entry-exit-logs/export (B-01-01) ─────────────────────────────

export const ExportEntryExitHistoryQuerySchema = GetEntryExitHistoryQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportEntryExitHistoryQuery',
  description: 'Filters and sort only — the export always returns the full matching set',
});
export type ExportEntryExitHistoryQuery = z.infer<typeof ExportEntryExitHistoryQuerySchema>;
