import type { RoutineCategory } from '@/app/api/_schemas/routine-category.schema';

export type RoutineCategoryRecord = RoutineCategory & {
  deletedAt: string | null;
};

// Y-09 FR-010: 初期カテゴリ6種（Phase 1 は固定・CRUD スコープ外）
export const SEED_ROUTINE_CATEGORIES: RoutineCategoryRecord[] = [
  { id: 'RC-001', name: 'ビギナー向け', sortOrder: 1, deletedAt: null },
  { id: 'RC-002', name: 'シェイプアップ', sortOrder: 2, deletedAt: null },
  { id: 'RC-003', name: 'ダイエット', sortOrder: 3, deletedAt: null },
  { id: 'RC-004', name: '運動不足解消', sortOrder: 4, deletedAt: null },
  { id: 'RC-005', name: '筋肥大', sortOrder: 5, deletedAt: null },
  { id: 'RC-006', name: '筋力アップ', sortOrder: 6, deletedAt: null },
];
