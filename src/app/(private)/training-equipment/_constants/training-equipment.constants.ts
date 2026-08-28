import type { InstallationStatus, LocationInGym } from '@/lib/api/types.gen';

export const TRAINING_EQUIPMENT_ENTITY_LABEL = 'トレーニング機材';

export const INSTALLATION_STATUS_LABELS: Record<InstallationStatus, string> = {
  installed: '設置中',
  maintenance: 'メンテナンス中',
  removed: '撤去済み',
  discarded: '廃棄',
};

export const LOCATION_IN_GYM_LABELS: Record<LocationInGym, string> = {
  aerobic_area: '有酸素エリア',
  machine_area: 'マシンエリア',
  free_weight_area: 'フリーウェイトエリア',
  stretch_area: 'ストレッチエリア',
};

export const LOCATION_IN_GYM_OPTIONS = (Object.keys(LOCATION_IN_GYM_LABELS) as LocationInGym[]).map(
  (value) => ({ value, label: LOCATION_IN_GYM_LABELS[value] }),
);

/** FR-001: 「廃棄」 (discarded) rows are hidden by default. */
export const TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT = 'exclude_discarded' as const;

export const TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS = [
  { value: 'exclude_discarded', label: '廃棄を除く（デフォルト）' },
  { value: 'all', label: '全ステータス' },
  { value: 'installed', label: '設置中' },
  { value: 'maintenance', label: 'メンテナンス中' },
  { value: 'removed', label: '撤去済み' },
  { value: 'discarded', label: '廃棄' },
] as const;

/** FR-018: the status-change reason is required free text, 1–500 characters (single and bulk alike). */
export const TRAINING_EQUIPMENT_CHANGED_REASON_MAX_LENGTH = 500;

/** FR-002: the API design caps the list/export `keyword` query parameter at 100 characters. */
export const TRAINING_EQUIPMENT_KEYWORD_MAX_LENGTH = 100;

/**
 * FR-003 field limits. Text lengths follow the API schema; the quantity ceiling is the shared
 * default for a numeric field (9 digits) — a tighter business cap is a PO decision.
 */
export const TRAINING_EQUIPMENT_NAME_MAX_LENGTH = 255;
export const TRAINING_EQUIPMENT_NOTE_MAX_LENGTH = 1000;
export const TRAINING_EQUIPMENT_QUANTITY_MAX = 999_999_999;

export const TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

/**
 * Bounds the table's own scroll container so the sticky header stays visible: without a height the
 * page's `main` scrolls instead and the header scrolls away with it. The offsets follow the toolbar
 * blocks rendered above the table (filter row, optional selection bar, optional result banner).
 */
export function getTrainingEquipmentTableMaxHeightClass(
  hasBanner: boolean,
  hasSelection: boolean,
): string {
  if (hasSelection) {
    return hasBanner ? 'max-h-[calc(100vh-367px)]' : 'max-h-[calc(100vh-330px)]';
  }
  return hasBanner ? 'max-h-[calc(100vh-307px)]' : 'max-h-[calc(100vh-270px)]';
}

export const TRAINING_EQUIPMENT_DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch size for the FR-011 history tab. The API is paginated, but the prototype defines no history
 * pager, so Phase 1 fetches as much as a single page can display in one request.
 */
export const TRAINING_EQUIPMENT_HISTORY_PAGE_SIZE = 200;

/**
 * FR-003 manufacturers. Per the API design answer the backend keeps no master and accepts a free
 * string, so the options are maintained on the frontend.
 */
export const TRAINING_EQUIPMENT_MANUFACTURERS = [
  'テクノジム',
  'ライフフィットネス',
  'マトリックス',
  'プリコー',
  'アイロテック',
  'LPN',
  'タフスタッフ',
  'ハンマーストレングス',
  'ノーチラス',
  'サイベックス',
] as const;
