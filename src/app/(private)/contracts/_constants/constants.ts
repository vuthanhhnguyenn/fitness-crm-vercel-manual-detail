import {
  Brand,
  type GetCrmMainContractsResponse,
  MainContractOtherStoreUsage,
  MainContractStatus,
  MainContractType,
} from '@/lib/api/types.gen';

export type MainContractRow = GetCrmMainContractsResponse['main_contracts'][number];

export const MAIN_CONTRACT_TYPE_LABELS: Record<MainContractType, string> = {
  [MainContractType.GENERAL]: '通常会員',
  [MainContractType.ONE_DAY]: '1Day会員',
  [MainContractType.FAMILY]: '家族会員',
  [MainContractType.KIDS]: 'キッズ会員',
  [MainContractType.STUDENT]: '学生会員',
  [MainContractType.CORPORATE]: '法人会員',
  [MainContractType.WELFARE]: '福祉会員',
  [MainContractType.PREPAID]: 'プリペイド会員',
  [MainContractType.SPECIAL]: '特別会員',
};

export const MAIN_CONTRACT_BRAND_LABELS: Record<Brand, string> = {
  [Brand.JOYFIT]: 'JOYFIT',
  [Brand.FIT365]: 'FIT365',
  [Brand.JOYFIT24]: 'JOYFIT24',
  [Brand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [Brand.JOYFIT_PLUS]: 'JOYFIT+',
};

export const MAIN_CONTRACT_STATUS_LABELS: Record<MainContractStatus, string> = {
  [MainContractStatus.ACTIVE]: '有効',
  [MainContractStatus.INACTIVE]: '無効',
};

export const MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS: Record<MainContractOtherStoreUsage, string> = {
  [MainContractOtherStoreUsage.ALL]: '全店舗',
  [MainContractOtherStoreUsage.DIRECT]: '直営店',
  [MainContractOtherStoreUsage.NONE]: '不可',
};

export const MAIN_CONTRACT_TYPE_BADGE_CLASSES: Record<MainContractType, string> = {
  [MainContractType.GENERAL]: 'bg-info/15 text-info border-info/20',
  [MainContractType.ONE_DAY]: 'bg-warning/15 text-warning border-warning/20',
  [MainContractType.FAMILY]: 'bg-success/15 text-success border-success/20',
  [MainContractType.KIDS]: 'bg-sky-100 text-sky-700 border-sky-200',
  [MainContractType.STUDENT]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [MainContractType.CORPORATE]: 'bg-orange-100 text-orange-700 border-orange-200',
  [MainContractType.WELFARE]: 'bg-teal-100 text-teal-700 border-teal-200',
  [MainContractType.PREPAID]: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  [MainContractType.SPECIAL]: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export const MAIN_CONTRACT_STATUS_BADGE_CLASSES: Record<MainContractStatus, string> = {
  [MainContractStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [MainContractStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
};

export const COMPANION_BENEFIT_FILTER_LABELS = {
  all: '全て',
  true: 'あり',
  false: 'なし',
} as const;

export type CompanionBenefitFilter = keyof typeof COMPANION_BENEFIT_FILTER_LABELS;
