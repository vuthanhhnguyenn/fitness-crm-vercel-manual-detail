import type {
  ToolType,
  TrainingEquipmentExerciseLink,
  TrainingEquipmentItem,
  TrainingEquipmentStatusHistory,
} from '@/app/api/_schemas/training-equipment.schema';

export type TrainingEquipmentMockItem = TrainingEquipmentItem;

export type ToolTypeMockRow = {
  id: string;
  code: ToolType['code'];
  name: string;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
};

export type TrainingEquipmentExerciseCatalogItem = {
  id: string;
  name: string;
  tool_type: TrainingEquipmentItem['tool_type'];
  difficulty: string;
  body_part: string;
};

export const SEED_TOOL_TYPES: ToolTypeMockRow[] = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    code: 'none',
    name: '自重',
    sort_order: 0,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000002-0000-4000-8000-000000000002',
    code: 'machine',
    name: 'マシン',
    sort_order: 1,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000003-0000-4000-8000-000000000003',
    code: 'cableMachine',
    name: 'ケーブル（マシン）',
    sort_order: 2,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000004-0000-4000-8000-000000000004',
    code: 'smithMachine',
    name: 'スミスマシン',
    sort_order: 3,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000005-0000-4000-8000-000000000005',
    code: 'barbell',
    name: 'バーベル',
    sort_order: 4,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000006-0000-4000-8000-000000000006',
    code: 'dumbbell',
    name: 'ダンベル',
    sort_order: 5,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000007-0000-4000-8000-000000000007',
    code: 'kettlebell',
    name: 'ケトルベル',
    sort_order: 6,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000008-0000-4000-8000-000000000008',
    code: 'resistanceBand',
    name: 'ゴムバンド',
    sort_order: 7,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a0000009-0000-4000-8000-000000000009',
    code: 'trx',
    name: 'TRX',
    sort_order: 8,
    is_active: true,
    deleted_at: null,
  },
  {
    id: 'a000000a-0000-4000-8000-00000000000a',
    code: 'other',
    name: 'その他',
    sort_order: 9,
    is_active: false,
    deleted_at: null,
  },
];

export const SEED_TRAINING_EQUIPMENT: TrainingEquipmentMockItem[] = [
  {
    id: 'TE-001',
    store_id: 'S-001',
    store_name: 'FIT365八潮店',
    name: 'ラットプルダウン LP-100',
    tool_type: 'cableMachine',
    quantity: 1,
    installation_area: 'machine_area',
    manufacturer: 'テクノジム',
    model_number: 'LP-100X',
    installed_on: '2023-05-01',
    status: 'maintenance',
    notes: '定期点検中',
    linked_exercise_count: 2,
    last_updated_at: '2026-06-24T09:00:00.000Z',
    last_updated_by: '田中花子',
    is_deleted: false,
  },
  {
    id: 'TE-002',
    store_id: 'S-001',
    store_name: 'FIT365八潮店',
    name: 'ダンベルセット 2-40kg',
    tool_type: 'dumbbell',
    quantity: 1,
    installation_area: 'free_weight_area',
    manufacturer: 'アイロテック',
    model_number: 'DS-40PRO',
    installed_on: '2024-04-11',
    status: 'installed',
    notes: null,
    linked_exercise_count: 0,
    last_updated_at: '2026-06-18T03:00:00.000Z',
    last_updated_by: '山田太郎',
    is_deleted: false,
  },
  {
    id: 'TE-003',
    store_id: 'S-001',
    store_name: 'FIT365八潮店',
    name: 'トレッドミル TM-500',
    tool_type: 'machine',
    quantity: 3,
    installation_area: 'aerobic_area',
    manufacturer: 'テクノジム',
    model_number: 'TM-500X',
    installed_on: '2022-01-15',
    status: 'installed',
    notes: null,
    linked_exercise_count: 0,
    last_updated_at: '2026-02-01T00:00:00.000Z',
    last_updated_by: '田中花子',
    is_deleted: false,
  },
  {
    id: 'TE-004',
    store_id: 'S-001',
    store_name: 'FIT365八潮店',
    name: 'バーベルセット 20-120kg',
    tool_type: 'barbell',
    quantity: 2,
    installation_area: 'free_weight_area',
    manufacturer: 'アイロテック',
    model_number: 'BS-120PRO',
    installed_on: '2021-08-20',
    status: 'removed',
    notes: null,
    linked_exercise_count: 0,
    last_updated_at: '2026-03-10T00:00:00.000Z',
    last_updated_by: '山田太郎',
    is_deleted: false,
  },
  {
    id: 'TE-005',
    store_id: 'S-001',
    store_name: 'FIT365八潮店',
    name: 'スミスマシン SM-200',
    tool_type: 'smithMachine',
    quantity: 1,
    installation_area: 'free_weight_area',
    manufacturer: 'ハンマーストレングス',
    model_number: 'SM-200X',
    installed_on: '2020-12-01',
    status: 'discarded',
    notes: null,
    linked_exercise_count: 0,
    last_updated_at: '2025-12-01T00:00:00.000Z',
    last_updated_by: '佐藤一郎',
    is_deleted: false,
  },
];

export const SEED_TRAINING_EQUIPMENT_HISTORY: TrainingEquipmentStatusHistory[] = [
  {
    id: 'TH-001',
    equipment_id: 'TE-001',
    changed_at: '2026-06-24T09:00:00.000Z',
    changed_by: '田中花子',
    from_status: 'installed',
    to_status: 'maintenance',
    reason: 'ケーブル摩耗確認',
  },
];

export const SEED_TRAINING_EQUIPMENT_LINKS: TrainingEquipmentExerciseLink[] = [
  {
    equipment_id: 'TE-001',
    exercise_id: 'EX-011',
    exercise_name: 'ラットプルダウン（ワイドグリップ）',
    exercise_tool_type: 'cableMachine',
    exercise_tool_name: 'ケーブル（マシン）',
    difficulty: '中級',
    body_part: '背中',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    equipment_id: 'TE-001',
    exercise_id: 'EX-012',
    exercise_name: 'シーテッドケーブルロウ',
    exercise_tool_type: 'cableMachine',
    exercise_tool_name: 'ケーブル（マシン）',
    difficulty: '中級',
    body_part: '背中',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const TRAINING_EQUIPMENT_EXERCISE_CATALOG: TrainingEquipmentExerciseCatalogItem[] = [
  {
    id: 'EX-011',
    name: 'ラットプルダウン（ワイドグリップ）',
    tool_type: 'cableMachine',
    difficulty: '中級',
    body_part: '背中',
  },
  {
    id: 'EX-012',
    name: 'ラットプルダウン（ナローグリップ）',
    tool_type: 'cableMachine',
    difficulty: '中級',
    body_part: '背中',
  },
  {
    id: 'EX-013',
    name: 'シーテッドケーブルロウ',
    tool_type: 'cableMachine',
    difficulty: '中級',
    body_part: '背中',
  },
  {
    id: 'EX-014',
    name: 'ストレートアームプルダウン',
    tool_type: 'cableMachine',
    difficulty: '上級',
    body_part: '背中',
  },
  {
    id: 'EX-015',
    name: 'フェイスプル',
    tool_type: 'cableMachine',
    difficulty: '中級',
    body_part: '肩',
  },
  {
    id: 'EX-016',
    name: 'トライセプスプッシュダウン',
    tool_type: 'cableMachine',
    difficulty: '初級',
    body_part: '腕',
  },
  {
    id: 'EX-017',
    name: 'バイセプスカール（ケーブル）',
    tool_type: 'cableMachine',
    difficulty: '初級',
    body_part: '腕',
  },
  {
    id: 'EX-018',
    name: 'ケーブルクロスオーバー',
    tool_type: 'cableMachine',
    difficulty: '上級',
    body_part: '胸',
  },
  {
    id: 'EX-019',
    name: 'ケーブルリアデルト',
    tool_type: 'cableMachine',
    difficulty: '中級',
    body_part: '肩',
  },
  {
    id: 'EX-020',
    name: 'スクワット（バーベル）',
    tool_type: 'barbell',
    difficulty: '中級',
    body_part: '脚',
  },
  {
    id: 'EX-021',
    name: 'デッドリフト（バーベル）',
    tool_type: 'barbell',
    difficulty: '上級',
    body_part: '背中',
  },
  {
    id: 'EX-022',
    name: 'ベンチプレス（バーベル）',
    tool_type: 'barbell',
    difficulty: '中級',
    body_part: '胸',
  },
  {
    id: 'EX-023',
    name: 'ダンベルカール',
    tool_type: 'dumbbell',
    difficulty: '初級',
    body_part: '腕',
  },
];
