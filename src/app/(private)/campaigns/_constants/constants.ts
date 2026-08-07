import { StoreListBrand } from '@/lib/api/types.gen';

export { StoreListBrand } from '@/lib/api/types.gen';

export type CampaignAcceptStatus = 'active' | 'inactive';
export type CampaignStatus = 'active' | 'inactive';
export type CampaignApplicationStartMonthType = 'first_month' | 'next_month' | 'custom_month';
export type CampaignAutoGrantTarget = 'all' | 'conditional';
export type CampaignGenderCondition = 'male' | 'female' | 'other';

export const CAMPAIGN_BRAND_LABELS: Record<StoreListBrand, string> = {
  [StoreListBrand.JOYFIT]: 'JOYFIT',
  [StoreListBrand.FIT365]: 'FIT365',
  [StoreListBrand.JOYFIT24]: 'JOYFIT24',
  [StoreListBrand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [StoreListBrand.JOYFIT_PLUS]: 'JOYFIT+',
};

export const CAMPAIGN_ACCEPT_STATUS_LABELS: Record<CampaignAcceptStatus, string> = {
  active: '受付中',
  inactive: '受付停止',
};

export const CAMPAIGN_ACCEPT_STATUS_BADGE_CLASSES: Record<CampaignAcceptStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export const CAMPAIGN_ACCEPT_STATUS_VALUES = ['active', 'inactive'] as const;
export const CAMPAIGN_STATUS_VALUES = ['active', 'inactive'] as const;

export const CAMPAIGN_APPLICATION_START_MONTH_LABELS: Record<
  CampaignApplicationStartMonthType,
  string
> = {
  first_month: '初月（利用開始月）',
  next_month: '翌月（利用開始月の翌月）',
  custom_month: 'X月指定',
};

export const CAMPAIGN_AUTO_GRANT_TARGET_LABELS: Record<CampaignAutoGrantTarget, string> = {
  all: '全員',
  conditional: '条件あり',
};

export const CAMPAIGN_GENDER_CONDITION_LABELS: Record<CampaignGenderCondition, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: '有効',
  inactive: '無効',
};
