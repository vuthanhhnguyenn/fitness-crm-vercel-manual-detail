import type { PositionRoleCategory } from '@/lib/api/types.gen';

export const POSITION_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export const POSITION_DEFAULT_PAGE_SIZE = 50;

/** 対象ロール select options (System is never selectable — Y-01 FR-018) */
export const POSITION_ROLE_OPTIONS: ReadonlyArray<{
  value: PositionRoleCategory;
  label: string;
}> = [
  { value: 'headquarter', label: '本部' },
  { value: 'manager', label: 'マネージャー (Manager)' },
  { value: 'staff', label: 'スタッフ (Staff)' },
  { value: 'trainer', label: 'トレーナー (Trainer)' },
  { value: 'observer', label: '閲覧のみ (Observer)' },
];

/** Short role display names for the list/preview badges */
export const POSITION_ROLE_BADGE_LABELS: Record<PositionRoleCategory, string> = {
  headquarter: '本部',
  manager: 'マネージャー',
  staff: 'スタッフ',
  trainer: 'トレーナー',
  observer: '閲覧のみ',
};
