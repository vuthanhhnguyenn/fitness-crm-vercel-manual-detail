import {
  BlacklistReasonCategory,
  BlacklistSource,
  type GetCrmBlacklistByIdResponse,
  UnpaidFilter,
} from '@/lib/api/types.gen';

// ─── Derived Types ────────────────────────────────────────────────────────────

export type BlacklistDetail = NonNullable<GetCrmBlacklistByIdResponse>['blacklist'];

// ─── Page size ────────────────────────────────────────────────────────────────

/**
 * FR-032 — V0 offers 25 / 50 / 100 / 200 with a default of 50. 200 is not built: both
 * the mock request schema and the real endpoint cap `limit` at 100, so a 200-row request
 * is rejected outright. The default follows the CRM-wide `PAGE_SIZE` (25) rather than
 * V0's 50, matching A-03 (spec Q-08 / research §2).
 */
export const BLACKLIST_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * FR-016 — mirrors `GetBlacklistQuerySchema.search.max(60)`. Enforced on the input as
 * well so an over-long paste is capped where the operator can see it, instead of coming
 * back as a 400 and an error toast.
 */
export const BLACKLIST_SEARCH_MAX_LENGTH = 60;

/**
 * FR-036 — the registration Sheet's 会員番号 lookup shares the same `search` parameter as
 * the list, so it inherits the same 60-character cap. Without it the field accepted
 * unbounded input and sent it as a query, which is also inconsistent with the list's own
 * search box capping at 60.
 */
export const MEMBER_NUMBER_MAX_LENGTH = BLACKLIST_SEARCH_MAX_LENGTH;

// ─── Label Maps ───────────────────────────────────────────────────────────────

/**
 * The **registration-path** axis — this is what the list's 登録理由 column and filter
 * show. Not to be confused with `BLACKLIST_REASON_CATEGORY_LABEL`, which is the reason
 * axis and is written by the registration form but displayed nowhere (FR-043a).
 */
export const BLACKLIST_SOURCE_LABEL: Record<BlacklistSource, string> = {
  [BlacklistSource.FORCED_WITHDRAWAL]: '強制退会',
  [BlacklistSource.MANUAL]: '手動登録',
};

/**
 * The **reason** axis. `EQUIPMENT_DAMAGE` is intentionally absent from
 * `BLACKLIST_REASON_OPTIONS` below — the registration form never offers it; it exists
 * only because migrated legacy rows carry it.
 */
export const BLACKLIST_REASON_CATEGORY_LABEL: Record<BlacklistReasonCategory, string> = {
  [BlacklistReasonCategory.NUISANCE]: '迷惑行為',
  [BlacklistReasonCategory.UNPAID]: '未納金',
  [BlacklistReasonCategory.FRAUDULENT_USE]: '不正利用',
  [BlacklistReasonCategory.OTHER]: 'その他',
  [BlacklistReasonCategory.EQUIPMENT_DAMAGE]: '設備破損',
};

export const UNPAID_FILTER_LABEL: Record<UnpaidFilter, string> = {
  [UnpaidFilter.HAS_UNPAID]: '未納金：あり',
  [UnpaidFilter.NO_UNPAID]: '未納金：なし',
};

// ─── Filter Option Lists ──────────────────────────────────────────────────────

export const BLACKLIST_SOURCE_OPTIONS = [
  { value: 'all', label: '全登録理由' },
  ...Object.values(BlacklistSource).map((value) => ({
    value,
    label: BLACKLIST_SOURCE_LABEL[value],
  })),
];

export const UNPAID_FILTER_OPTIONS = [
  { value: 'all', label: '未納金：全件' },
  ...Object.values(UnpaidFilter).map((value) => ({
    value,
    label: UNPAID_FILTER_LABEL[value],
  })),
];

/** FR-043 — the four the Sheet offers, in V0's order. `equipment_damage` is not one. */
export const BLACKLIST_REASON_OPTIONS: { value: BlacklistReasonCategory; label: string }[] = [
  BlacklistReasonCategory.NUISANCE,
  BlacklistReasonCategory.UNPAID,
  BlacklistReasonCategory.FRAUDULENT_USE,
  BlacklistReasonCategory.OTHER,
].map((value) => ({ value, label: BLACKLIST_REASON_CATEGORY_LABEL[value] }));

// ─── Badge classes ────────────────────────────────────────────────────────────

export function getBlacklistSourceBadgeClass(source: BlacklistSource): string {
  if (source === BlacklistSource.FORCED_WITHDRAWAL) {
    return 'bg-destructive/15 text-destructive border-destructive/20';
  }
  return 'bg-warning/15 text-warning border-warning/20';
}
