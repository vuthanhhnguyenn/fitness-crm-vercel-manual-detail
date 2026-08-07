import {
  Brand,
  ContractType,
  Gender,
  MemberStatus,
  MemberType,
  MemoType,
} from '@/lib/api/types.gen';

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  [MemberType.REGULAR]: '通常会員',
  [MemberType.ONE_DAY_MEMBER]: '1Day会員',
  [MemberType.FAMILY]: '家族会員',
  [MemberType.CORPORATE]: '法人会員',
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.REGULAR]: '通常会員',
  [ContractType.ONE_DAY_MEMBER]: '1Day会員',
  [ContractType.FAMILY]: '家族会員',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: '有効',
  [MemberStatus.SUSPENDED]: '休会中',
  [MemberStatus.GATE_STOP]: 'ゲートストップ',
  [MemberStatus.PENDING_WITHDRAWAL]: '退会予定',
  [MemberStatus.WITHDRAWN]: '退会済み',
  [MemberStatus.FORCE_WITHDRAWN]: '強制退会済み',
};

export const BRAND_LABELS: Record<Brand, string> = {
  [Brand.JOYFIT]: 'JOYFIT',
  [Brand.FIT365]: 'FIT365',
  [Brand.JOYFIT_PLUS]: 'JOYFIT+',
  [Brand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [Brand.JOYFIT24]: 'JOYFIT24',
};

export const MEMBER_STATUS_CLASSES: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [MemberStatus.SUSPENDED]: 'bg-warning/15 text-warning border-warning/20',
  [MemberStatus.GATE_STOP]: 'bg-destructive/15 text-destructive border-destructive/20',
  [MemberStatus.PENDING_WITHDRAWAL]: 'bg-destructive/15 text-destructive border-destructive/20',
  [MemberStatus.WITHDRAWN]: 'bg-muted text-muted-foreground border-border',
  [MemberStatus.FORCE_WITHDRAWN]: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const BRAND_CLASSES: Record<Brand, string> = {
  [Brand.JOYFIT]: 'bg-blue-100 text-blue-600',
  [Brand.FIT365]: 'bg-green-100 text-green-600',
  [Brand.JOYFIT_PLUS]: 'bg-yellow-100 text-yellow-600',
  [Brand.JOYFIT_YOGA]: 'bg-purple-100 text-purple-600',
  [Brand.JOYFIT24]: 'bg-red-100 text-red-600',
};

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: '男性',
  [Gender.FEMALE]: '女性',
  [Gender.OTHER]: 'その他',
};

export const MEMO_TYPE_LABELS: Record<MemoType, string> = {
  [MemoType.CAUTION]: '要注意',
  [MemoType.VIP]: 'VIP',
  [MemoType.OTHER]: 'その他',
};

export const GENDER_CLASSES: Record<Gender, string> = {
  [Gender.MALE]: 'bg-gender-male/15 text-gender-male border-gender-male/20',
  [Gender.FEMALE]: 'bg-gender-female/15 text-gender-female border-gender-female/20',
  [Gender.OTHER]: 'bg-muted text-muted-foreground border-muted/20',
};
