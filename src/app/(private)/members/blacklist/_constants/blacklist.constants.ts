import {
  BlacklistManualReason,
  BlacklistRegistrationSource,
  type GetCrmBlacklistByIdResponse,
  UnpaidFilter,
} from '@/lib/api/types.gen';

// ─── Derived Types ────────────────────────────────────────────────────────────

export type BlacklistDetail = NonNullable<GetCrmBlacklistByIdResponse>['blacklist'];
export type MatchConditions = BlacklistDetail['matchConditions'];

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const BLACKLIST_REGISTRATION_SOURCE_LABEL: Record<BlacklistRegistrationSource, string> = {
  [BlacklistRegistrationSource.FORCED_WITHDRAWAL]: '強制退会',
  [BlacklistRegistrationSource.MANUAL]: '手動登録',
};

export const BLACKLIST_MANUAL_REASON_LABEL: Record<BlacklistManualReason, string> = {
  [BlacklistManualReason.NUISANCE]: '迷惑行為',
  [BlacklistManualReason.UNPAID]: '未納金',
  [BlacklistManualReason.FRAUDULENT_USE]: '不正利用',
  [BlacklistManualReason.OTHER]: 'その他',
};

export const UNPAID_FILTER_LABEL: Record<UnpaidFilter, string> = {
  [UnpaidFilter.HAS_DEBT]: '未納金：あり',
  [UnpaidFilter.NO_DEBT]: '未納金：なし',
};

// ─── Filter Option Lists ──────────────────────────────────────────────────────

export const BLACKLIST_REGISTRATION_SOURCE_OPTIONS = [
  { value: 'all', label: '全登録理由' },
  ...Object.values(BlacklistRegistrationSource).map((value) => ({
    value,
    label: BLACKLIST_REGISTRATION_SOURCE_LABEL[value],
  })),
];

export const UNPAID_FILTER_OPTIONS = [
  { value: 'all', label: '未納金：全件' },
  ...Object.values(UnpaidFilter).map((value) => ({
    value,
    label: UNPAID_FILTER_LABEL[value],
  })),
];

// ─── Badge classes ────────────────────────────────────────────────────────────

export function getRegistrationSourceBadgeClass(source: BlacklistRegistrationSource): string {
  if (source === BlacklistRegistrationSource.FORCED_WITHDRAWAL) {
    return 'bg-destructive/15 text-destructive border-destructive/20';
  }
  return 'bg-warning/15 text-warning border-warning/20';
}

// ─── Match Condition Labels ───────────────────────────────────────────────────

export const MATCH_CONDITION_LABEL: Record<keyof MatchConditions, string> = {
  nameAndBirthdate: '氏名＆生年月日一致',
  email: 'メール一致',
  phone: '電話一致',
  address: '住所一致',
};
