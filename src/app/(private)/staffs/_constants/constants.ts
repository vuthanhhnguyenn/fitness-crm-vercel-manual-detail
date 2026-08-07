import { StaffBrand, StaffStatus } from '@/lib/api/types.gen';

export { StaffBrand, StaffStatus } from '@/lib/api/types.gen';

export const StaffRole = {
  SYSTEM: 'system',
  HEADQUARTER: 'headquarter',
  MANAGER: 'manager',
  STAFF: 'staff',
  TRAINER: 'trainer',
  OBSERVER: 'observer',
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.SYSTEM]: '（非表示）',
  [StaffRole.HEADQUARTER]: '本部',
  [StaffRole.MANAGER]: 'マネージャー',
  [StaffRole.STAFF]: 'スタッフ',
  [StaffRole.TRAINER]: 'トレーナー',
  [StaffRole.OBSERVER]: '閲覧のみ',
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  [StaffStatus.ACTIVE]: '有効',
  [StaffStatus.INACTIVE]: '無効',
};

export const STAFF_BRAND_LABELS: Record<StaffBrand, string> = {
  [StaffBrand.ALL]: '全ブランド',
  [StaffBrand.JOYFIT]: 'JOYFIT',
  [StaffBrand.JOYFIT_PLUS]: 'JOYFIT+',
  [StaffBrand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [StaffBrand.JOYFIT24]: 'JOYFIT24',
  [StaffBrand.FIT365]: 'FIT365',
};

export const STAFF_STATUS_VARIANTS: Record<
  StaffStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [StaffStatus.ACTIVE]: 'default',
  [StaffStatus.INACTIVE]: 'outline',
};

export const STAFF_STATUS_CLASSES: Record<StaffStatus, string> = {
  [StaffStatus.ACTIVE]: 'bg-green-100 text-green-700 border-green-200',
  [StaffStatus.INACTIVE]: 'bg-gray-100 text-gray-500 border-gray-200',
};
