import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

export type TrainingEquipmentStatus = TrainingEquipmentItem['status'];
export type TrainingEquipmentLocationInGym = NonNullable<
  TrainingEquipmentItem['installation_area']
>;

export const TRAINING_EQUIPMENT_STATUS_LABELS: Record<TrainingEquipmentStatus, string> = {
  installed: '設置中',
  maintenance: 'メンテナンス中',
  removed: '撤去済み',
  discarded: '廃棄',
};

export const TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT = 'exclude_discarded' as const;

export const TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS: Record<
  TrainingEquipmentLocationInGym,
  string
> = {
  aerobic_area: '有酸素エリア',
  machine_area: 'マシンエリア',
  free_weight_area: 'フリーウェイトエリア',
  stretch_area: 'ストレッチエリア',
};

export const TRAINING_EQUIPMENT_INSTALLATION_AREA_OPTIONS = (
  Object.keys(TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS) as TrainingEquipmentLocationInGym[]
).map((value) => ({
  value,
  label: TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS[value],
}));

export const TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS = [
  { value: 'exclude_discarded', label: '廃棄を除く（デフォルト）' },
  { value: 'all', label: '全ステータス' },
  { value: 'installed', label: '設置中' },
  { value: 'maintenance', label: 'メンテナンス中' },
  { value: 'removed', label: '撤去済み' },
  { value: 'discarded', label: '廃棄' },
] as const;

export const TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
