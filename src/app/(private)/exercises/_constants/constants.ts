import type {
  ExerciseHandUsage,
  ExerciseLevel,
  ExerciseStatus,
  ExerciseTagSetting,
} from '@/lib/api/types.gen';

export const EXERCISE_TAGS = [
  { id: 'grip-narrow', label: 'ナローグリップ', category: 'グリップ' },
  { id: 'grip-wide', label: 'ワイドグリップ', category: 'グリップ' },
  { id: 'grip-reverse', label: 'リバースグリップ', category: 'グリップ' },
  { id: 'direction-underhand', label: 'アンダーハンド', category: '向き' },
  { id: 'direction-overhand', label: 'オーバーハンド', category: '向き' },
  { id: 'width-narrow', label: 'ナロースタンス', category: '幅' },
  { id: 'width-wide', label: 'ワイドスタンス', category: '幅' },
  { id: 'center-high', label: 'ハイポジション', category: '重心位置' },
  { id: 'center-low', label: 'ローポジション', category: '重心位置' },
] as const satisfies readonly Pick<ExerciseTagSetting, 'id' | 'label' | 'category'>[];

export const EXERCISE_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'ビギナー' },
  { value: 'expert', label: 'エキスパート' },
] as const satisfies readonly { value: ExerciseLevel; label: string }[];

export const EXERCISE_HAND_USAGE_OPTIONS = [
  { value: 'both_hands', label: '両手' },
  { value: 'single_hand', label: '片手' },
  { value: 'both_feet', label: '両足' },
  { value: 'single_leg', label: '片足' },
] as const satisfies readonly { value: ExerciseHandUsage; label: string }[];

export const EXERCISE_STATUS_OPTIONS = [
  { value: 'public', label: '公開' },
  { value: 'private', label: '非公開' },
] as const satisfies readonly { value: ExerciseStatus; label: string }[];

export const EXERCISE_STATUS_LABELS: Record<ExerciseStatus, string> = {
  public: '公開',
  private: '非公開',
};

export const EXERCISE_STATUS_BADGE_CLASSES: Record<ExerciseStatus, string> = {
  public: 'bg-success/15 text-success border-success/20',
  private: 'bg-muted text-muted-foreground border-border',
};

export const EXERCISE_STATUS_DOT_CLASSES: Record<ExerciseStatus, string> = {
  public: 'bg-success',
  private: 'bg-muted-foreground',
};

export const EXERCISE_LEVEL_LABELS: Record<ExerciseLevel, string> = {
  beginner: 'ビギナー',
  expert: 'エキスパート',
};

export const EXERCISE_LEVEL_BADGE_CLASSES: Record<ExerciseLevel, string> = {
  beginner: 'bg-success/15 text-success border-success/20',
  expert: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const EXERCISE_CATEGORY_BADGE_CLASSES = 'border-border bg-muted/70 text-foreground';

export const EXERCISE_HAND_USAGE_LABELS: Record<ExerciseHandUsage, string> = {
  both_hands: '両手',
  single_hand: '片手',
  both_feet: '両足',
  single_leg: '片足',
};

export const EXERCISE_SORT_FIELDS = ['nameJa', 'publishStatus', 'updatedAt'] as const;

export const EXERCISE_STEP_LABELS = [
  { step: 0, label: '0: トレーニングポイント' },
  { step: 1, label: '1: 開始姿勢' },
  { step: 2, label: '2: 動作説明' },
  { step: 3, label: '3: 最終姿勢' },
  { step: 4, label: '4: 戻し動作' },
] as const;

export const EXERCISE_STEP_TRANSLATION_LABEL = '英語版（自動生成）';
export const EXERCISE_STEP_TRANSLATION_HELP = 'English translation auto-generated';

export function getExercisePublishActionLabel(status: ExerciseStatus) {
  return status === 'private' ? '公開する' : '非公開にする';
}

export function getExerciseFilterLabel<T extends string>(
  value: T | null | undefined,
  fallback: string,
) {
  return value ?? fallback;
}

export function groupExerciseTags(
  tags: readonly Pick<ExerciseTagSetting, 'id' | 'label' | 'category'>[] | undefined,
) {
  const grouped = new Map<string, Array<Pick<ExerciseTagSetting, 'id' | 'label' | 'category'>>>();
  for (const tag of tags ?? []) {
    const current = grouped.get(tag.category) ?? [];
    grouped.set(tag.category, [...current, tag]);
  }
  return [...grouped.entries()] as Array<
    [string, Array<Pick<ExerciseTagSetting, 'id' | 'label' | 'category'>>]
  >;
}

export function findExerciseOptionLabel(
  options: readonly { id: string; label: string }[],
  id: string,
) {
  return options.find((item) => item.id === id)?.label ?? id;
}
