import type { PromoCodeListRowStatus } from '../_components/promo-code-table';

export const PROMO_CODE_STATUS_LABELS: Record<PromoCodeListRowStatus, string> = {
  active: '有効',
  expired: '期限切れ',
  limit_reached: '上限到達',
  inactive: '無効',
};

export const PROMO_CODE_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | PromoCodeListRowStatus;
  label: string;
}> = [
  { value: 'all', label: 'すべてのステータス' },
  { value: 'active', label: PROMO_CODE_STATUS_LABELS.active },
  { value: 'expired', label: PROMO_CODE_STATUS_LABELS.expired },
  { value: 'limit_reached', label: PROMO_CODE_STATUS_LABELS.limit_reached },
  { value: 'inactive', label: PROMO_CODE_STATUS_LABELS.inactive },
];

export type PromoCodeIssuerFilterValue = 'all' | 'headquarter' | 'store_staff';

export const PROMO_CODE_ISSUER_LABELS: Record<
  Exclude<PromoCodeIssuerFilterValue, 'all'>,
  string
> = {
  headquarter: '本部',
  store_staff: '店舗スタッフ',
};

export const PROMO_CODE_ISSUER_FILTER_OPTIONS: Array<{
  value: PromoCodeIssuerFilterValue;
  label: string;
}> = [
  { value: 'all', label: 'すべての発行者' },
  { value: 'headquarter', label: PROMO_CODE_ISSUER_LABELS.headquarter },
  { value: 'store_staff', label: PROMO_CODE_ISSUER_LABELS.store_staff },
];

export const PROMO_CODE_USAGE_CAP_MODE_LABELS = {
  unlimited: '無制限',
  limited: '回数指定',
} as const;

export const PROMO_CODE_STORE_SCOPE_LABELS = {
  all: '全店舗で使用可能',
  branch: '発行店舗のみで使用可能',
} as const;
