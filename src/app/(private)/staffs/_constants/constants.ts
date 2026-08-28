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
  [StaffStatus.INVITED]: '招待中',
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
  [StaffStatus.INVITED]: 'outline',
};

/** 有効=success, 無効=muted, 招待中=info — src: staff-list.tsx getStatusBadge (L124-L134) */
export const STAFF_STATUS_CLASSES: Record<StaffStatus, string> = {
  [StaffStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [StaffStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
  [StaffStatus.INVITED]: 'bg-info/15 text-info border-info/20',
};

/** ロール毎のバッジ色 — src: staff-list.tsx getRoleBadgeClass (L136-L149) */
export const STAFF_ROLE_BADGE_CLASSES: Record<StaffRole, string> = {
  [StaffRole.SYSTEM]: 'bg-muted text-muted-foreground border-border',
  [StaffRole.HEADQUARTER]: 'bg-primary/10 text-primary border-primary/20',
  [StaffRole.MANAGER]: 'bg-info/15 text-info border-info/20',
  [StaffRole.STAFF]: 'bg-muted text-muted-foreground border-border',
  [StaffRole.TRAINER]: 'bg-success/15 text-success border-success/20',
  [StaffRole.OBSERVER]: 'bg-warning/15 text-warning border-warning/20',
};
