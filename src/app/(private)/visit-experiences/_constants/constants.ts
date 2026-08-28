import type {
  VisitExperienceDateRangeFilter,
  VisitExperienceStatus,
} from '@/types/api/visit-experience.type';
import { VISIT_EXPERIENCE_STATUS_LABELS } from '@/types/api/visit-experience.type';

export const STATUS_OPTIONS: { label: string; value: VisitExperienceStatus | '' }[] = [
  { label: '全ステータス', value: '' },
  ...(Object.entries(VISIT_EXPERIENCE_STATUS_LABELS) as [VisitExperienceStatus, string][]).map(
    ([value, label]) => ({ label, value }),
  ),
];

export const BRAND_OPTIONS = [
  { label: '全ブランド', value: '' },
  { label: 'FIT365', value: 'FIT365' },
  { label: 'JOYFIT', value: 'JOYFIT' },
];

export const DATE_RANGE_OPTIONS: { label: string; value: VisitExperienceDateRangeFilter | '' }[] = [
  { label: '全期間', value: '' },
  { label: '本日', value: 'today' },
  { label: '直近3日', value: 'last_3_days' },
  { label: '直近7日', value: 'last_7_days' },
];

export const BL_MATCH_OPTIONS: { label: string; value: string }[] = [
  { label: '全件', value: '' },
  { label: '要注意者のみ', value: 'true' },
];

export const BL_MATCH_SELECT_ITEMS = BL_MATCH_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value || '全件',
}));

export const STORE_OPTIONS = [
  'Fit365八潮店',
  'JOYFIT東十条店',
  'JOYFIT24 新宿店',
  'JOYFIT YOGA 心斎橋店',
  'JOYFIT+ 名古屋駅前店',
];

export const STATUS_SELECT_ITEMS = STATUS_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value || '全ステータス',
}));

export const BRAND_SELECT_ITEMS = BRAND_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value || '全ブランド',
}));

export const DATE_RANGE_SELECT_ITEMS = DATE_RANGE_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value || '全期間',
}));

export const STORE_SELECT_ITEMS = [
  { label: '全店舗', value: '全店舗' },
  ...STORE_OPTIONS.map((store) => ({ label: store, value: store })),
];
