export const BRAND_OPTIONS = ['JOYFIT', 'FIT365'] as const;

export const TERMS_TYPE_OPTIONS = [
  'membership',
  'privacy',
  'payment',
  'companion',
  'withdrawal',
  'suspension',
] as const;

export const TERMS_STATUS_OPTIONS = ['published', 'expired', 'draft'] as const;
export const TERMS_SORT_OPTIONS = ['displayOrder', 'effectiveFrom', 'createdAt'] as const;
export const TERMS_ORDER_OPTIONS = ['asc', 'desc'] as const;
export const INCLUDE_DELETED_VALUES = ['true', 'false'] as const;
export const TERMS_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export const DEFAULT_TERMS_PAGE_SIZE = 20;
export const DEFAULT_TERMS_SORT = 'displayOrder';
export const DEFAULT_TERMS_ORDER = 'asc';

export type TermsBrand = (typeof BRAND_OPTIONS)[number];
export type TermsType = (typeof TERMS_TYPE_OPTIONS)[number];
export type TermsStatus = (typeof TERMS_STATUS_OPTIONS)[number];

export const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  membership: '会員規約',
  privacy: 'プライバシーポリシー',
  payment: '決済規約',
  companion: '同伴規約',
  withdrawal: '退会規約',
  suspension: '休会規約',
};

export const TERMS_STATUS_LABELS: Record<TermsStatus, string> = {
  published: '公開中',
  expired: '適用終了',
  draft: '下書き',
};
