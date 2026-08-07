import { FranchiseCompanyStatus, FranchiseCompanyType } from '@/lib/api/types.gen';

export const FRANCHISE_COMPANY_TYPE_VALUES = Object.values(
  FranchiseCompanyType,
) as FranchiseCompanyType[];

export const FRANCHISE_COMPANY_STATUS_VALUES = Object.values(
  FranchiseCompanyStatus,
) as FranchiseCompanyStatus[];

export const FRANCHISE_COMPANY_TYPE_LABELS: Record<FranchiseCompanyType, string> = {
  [FranchiseCompanyType.DIRECT]: '直営',
  [FranchiseCompanyType.FC]: 'FC',
};

export const FRANCHISE_COMPANY_TYPE_FORM_LABELS: Record<FranchiseCompanyType, string> = {
  [FranchiseCompanyType.DIRECT]: '直営',
  [FranchiseCompanyType.FC]: 'フランチャイズ（FC）',
};

export const FRANCHISE_COMPANY_STATUS_LABELS: Record<FranchiseCompanyStatus, string> = {
  [FranchiseCompanyStatus.ACTIVE]: '有効',
  [FranchiseCompanyStatus.INACTIVE]: '無効',
};

export const FRANCHISE_COMPANY_TYPE_OPTIONS = [
  { value: 'all', label: '全区分' },
  ...FRANCHISE_COMPANY_TYPE_VALUES.map((value) => ({
    value,
    label: FRANCHISE_COMPANY_TYPE_LABELS[value],
  })),
] as const;

export const FRANCHISE_COMPANY_STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  ...FRANCHISE_COMPANY_STATUS_VALUES.map((value) => ({
    value,
    label: FRANCHISE_COMPANY_STATUS_LABELS[value],
  })),
] as const;

export const FRANCHISE_COMPANY_TYPE_BADGE_CLASSES: Record<FranchiseCompanyType, string> = {
  [FranchiseCompanyType.DIRECT]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [FranchiseCompanyType.FC]: '',
};

export const FRANCHISE_COMPANY_STATUS_BADGE_CLASSES: Record<FranchiseCompanyStatus, string> = {
  [FranchiseCompanyStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [FranchiseCompanyStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
};
