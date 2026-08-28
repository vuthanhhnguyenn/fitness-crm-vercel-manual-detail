import type { ExerciseMasterListItem } from '@/lib/api/types.gen';

export type TabKey = 'category' | 'muscle' | 'tool' | 'exercise_type';
export type FormMode = 'create' | 'edit';

export const TAB_ORDER: TabKey[] = ['category', 'muscle', 'tool', 'exercise_type'];

export const TAB_META: Record<TabKey, { label: string; hint: string }> = {
  category: { label: 'カテゴリ', hint: '名称・コードで検索...' },
  muscle: { label: '筋肉部位', hint: '名称・コードで検索...' },
  tool: { label: '器具種別', hint: '名称・コードで検索...' },
  exercise_type: { label: 'エクササイズタイプ', hint: '名称・コードで検索...' },
};

export function toLabel(status: ExerciseMasterListItem['status']) {
  return status === 'active' ? '有効' : '無効';
}

export function toStatusBadgeClass(status: ExerciseMasterListItem['status']) {
  return status === 'active'
    ? 'border-success/20 bg-success/15 text-success'
    : 'border-border bg-muted text-muted-foreground';
}

export function getNextSortOrder(items: ExerciseMasterListItem[]) {
  return String((items.reduce((max, item) => Math.max(max, item.sortOrder), 0) || 0) + 1);
}
