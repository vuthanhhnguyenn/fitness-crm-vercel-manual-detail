import { PAGE_SIZE } from '@/constants/app.constants';

/**
 * Lesson Content Management — shared constants for the `/lessons` feature.
 * User-visible labels are Japanese; identifiers/keys are English (snake_case to
 * match the mock query/response conventions used across `crm/*`).
 */

export const LESSONS_PAGE_SIZE = PAGE_SIZE;

export type LessonTab = 'studio' | 'personal' | 'bodycare';

export const LESSON_TABS: { value: LessonTab; label: string }[] = [
  { value: 'studio', label: 'スタジオレッスン' },
  { value: 'personal', label: 'パーソナルトレーニング' },
  { value: 'bodycare', label: 'ボディケア' },
];

/** Which lesson-contents subset (Studio vs Body care) a tab maps to. */
export const TAB_TO_KIND: Record<Exclude<LessonTab, 'personal'>, 'studio' | 'bodycare'> = {
  studio: 'studio',
  bodycare: 'bodycare',
};

export type LessonBrand = 'joyfit' | 'fit365';
export type LessonStatus = 'active' | 'inactive';
export type LessonPricingType = 'included' | 'paid';
export type LessonGenderRestriction = 'none' | 'male' | 'female';

export const LESSON_BRAND_LABELS: Record<LessonBrand, string> = {
  joyfit: 'JOYFIT',
  fit365: 'FIT365',
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  active: '有効',
  inactive: '無効',
};

export const LESSON_STATUS_CLASSES: Record<LessonStatus, string> = {
  active: 'bg-success/15 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
};

export const LESSON_PRICING_TYPE_LABELS: Record<LessonPricingType, string> = {
  included: '会費内',
  paid: '都度有料',
};

export const LESSON_GENDER_RESTRICTION_LABELS: Record<LessonGenderRestriction, string> = {
  none: '制限なし',
  male: '男性限定',
  female: '女性限定',
};

export const LESSON_GENDER_RESTRICTION_CLASSES: Record<LessonGenderRestriction, string> = {
  none: 'text-muted-foreground',
  male: 'text-gender-male',
  female: 'text-gender-female',
};

/** Detailed-filter axis: lesson category (区分). */
export const LESSON_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'スタジオレッスン', label: 'スタジオレッスン' },
  { value: 'ボディケア', label: 'ボディケア' },
];

/** Detailed-filter axis: studio/body-care content category (カテゴリ). */
export const STUDIO_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ヨガ', label: 'ヨガ' },
  { value: 'エアロビクス', label: 'エアロビクス' },
  { value: 'ダンス', label: 'ダンス' },
  { value: '筋力', label: '筋力' },
  { value: 'ストレッチ', label: 'ストレッチ' },
  { value: 'ピラティス', label: 'ピラティス' },
  { value: 'ボディケア', label: 'ボディケア' },
];

/** Detailed-filter axis: personal training plan category (プラン区分). */
export const PERSONAL_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ダイエット', label: 'ダイエット' },
  { value: '筋力アップ', label: '筋力アップ' },
  { value: '姿勢改善', label: '姿勢改善' },
  { value: '体力づくり', label: '体力づくり' },
  { value: 'リハビリ', label: 'リハビリ' },
];

export const PERSONAL_CATEGORY_CLASSES: Record<string, string> = {
  ダイエット: 'bg-info/10 text-info border-info/20',
  筋力アップ: 'bg-destructive/10 text-destructive border-destructive/20',
  姿勢改善: 'bg-success/10 text-success border-success/20',
  体力づくり: 'bg-warning/10 text-warning border-warning/20',
  リハビリ: 'bg-muted text-muted-foreground border-border',
};

/** Sortable column keys per table (must match the mock route `sort_by` enums). */
export const LESSON_CONTENT_SORT_KEYS = ['id', 'name', 'duration', 'status', 'brand'] as const;
export const PERSONAL_PLAN_SORT_KEYS = ['id', 'name', 'category', 'duration', 'price'] as const;

export type LessonContentSortKey = (typeof LESSON_CONTENT_SORT_KEYS)[number];
export type PersonalPlanSortKey = (typeof PERSONAL_PLAN_SORT_KEYS)[number];
