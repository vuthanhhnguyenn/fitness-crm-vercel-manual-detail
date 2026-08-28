import type {
  InstallationStatus,
  LocationInGym,
  ToolType,
  TrainingEquipmentStatusHistoryItem,
  TrainingEquipmentToolType,
} from '@/app/api/_schemas/training-equipment.schema';

import { EXERCISE_MASTER_KIND_PREFIX, EXERCISE_MASTER_SEEDS } from './exercise-master.seed';
import { SEED_EXERCISES } from './exercise.seed';

export type ToolTypeMockRow = {
  id: string;
  code: ToolType['code'];
  name: string;
  sortOrder: number;
  isActive: boolean;
  deletedAt: string | null;
};

/** Internal mock row. `statusChanged*` backs the FR-004 status card. */
export type TrainingEquipmentMockItem = {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  mstToolId: string;
  quantity: number;
  locationInGym: LocationInGym | null;
  manufacturer: string | null;
  model: string | null;
  installedOn: string | null;
  installationStatus: InstallationStatus;
  note: string | null;
  statusChangedAt: string;
  statusChangedByName: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type TrainingEquipmentExerciseLinkRow = {
  equipmentId: string;
  exerciseId: string;
  createdAt: string;
};

export type TrainingEquipmentExerciseCatalogItem = {
  exerciseId: string;
  exerciseCode: string;
  name: string;
  mstToolId: string;
  difficulty: string | null;
  bodyPart: string | null;
};

export type TrainingEquipmentStatusHistoryRow = TrainingEquipmentStatusHistoryItem & {
  equipmentId: string;
};

const TOOL_ID = {
  none: 'a0000001-0000-4000-8000-000000000001',
  machine: 'a0000002-0000-4000-8000-000000000002',
  cableMachine: 'a0000003-0000-4000-8000-000000000003',
  smithMachine: 'a0000004-0000-4000-8000-000000000004',
  barbell: 'a0000005-0000-4000-8000-000000000005',
  dumbbell: 'a0000006-0000-4000-8000-000000000006',
  kettlebell: 'a0000007-0000-4000-8000-000000000007',
  resistanceBand: 'a0000008-0000-4000-8000-000000000008',
  trx: 'a0000009-0000-4000-8000-000000000009',
  other: 'a000000a-0000-4000-8000-00000000000a',
} satisfies Record<ToolType['code'], string>;

/** Tool-type master (`mst_tools`) — the 10 E-03 tool types, including "none (bodyweight)". */
export const SEED_TOOL_TYPES: ToolTypeMockRow[] = [
  { id: TOOL_ID.none, code: 'none', name: '自重', sortOrder: 0, isActive: true, deletedAt: null },
  {
    id: TOOL_ID.machine,
    code: 'machine',
    name: 'マシン',
    sortOrder: 1,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.cableMachine,
    code: 'cableMachine',
    name: 'ケーブル（マシン）',
    sortOrder: 2,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.smithMachine,
    code: 'smithMachine',
    name: 'スミスマシン',
    sortOrder: 3,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.barbell,
    code: 'barbell',
    name: 'バーベル',
    sortOrder: 4,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.dumbbell,
    code: 'dumbbell',
    name: 'ダンベル',
    sortOrder: 5,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.kettlebell,
    code: 'kettlebell',
    name: 'ケトルベル',
    sortOrder: 6,
    isActive: true,
    deletedAt: null,
  },
  {
    id: TOOL_ID.resistanceBand,
    code: 'resistanceBand',
    name: 'ゴムバンド',
    sortOrder: 7,
    isActive: true,
    deletedAt: null,
  },
  { id: TOOL_ID.trx, code: 'trx', name: 'TRX', sortOrder: 8, isActive: true, deletedAt: null },
  {
    id: TOOL_ID.other,
    code: 'other',
    name: 'その他',
    sortOrder: 9,
    isActive: true,
    deletedAt: null,
  },
];

export const SEED_TRAINING_EQUIPMENT: TrainingEquipmentMockItem[] = [
  {
    id: 'TE-001',
    storeId: 'store-001',
    storeName: 'Fit365八潮店',
    name: 'ラットプルダウン LP-100',
    mstToolId: TOOL_ID.cableMachine,
    quantity: 1,
    locationInGym: 'machine_area',
    manufacturer: 'テクノジム',
    model: 'LP-100X',
    installedOn: '2023-05-01',
    installationStatus: 'maintenance',
    note: '2026/01/20にワイヤー摩耗を確認。定期点検で交換推奨の指摘あり。\n\n担当業者: テクノジムジャパン（担当: 高橋）\n連絡先: 03-9876-5432',
    statusChangedAt: '2026-06-24T09:00:00.000Z',
    statusChangedByName: '田中花子',
    createdAt: '2023-05-01T00:00:00.000Z',
    updatedAt: '2026-06-24T09:00:00.000Z',
    isDeleted: false,
  },
  {
    id: 'TE-002',
    storeId: 'store-001',
    storeName: 'Fit365八潮店',
    name: 'ダンベルセット 2-40kg',
    mstToolId: TOOL_ID.dumbbell,
    quantity: 1,
    locationInGym: 'free_weight_area',
    manufacturer: 'アイロテック',
    model: 'DS-40PRO',
    installedOn: '2024-04-11',
    installationStatus: 'installed',
    note: null,
    statusChangedAt: '2026-06-18T03:00:00.000Z',
    statusChangedByName: '山田太郎',
    createdAt: '2024-04-11T00:00:00.000Z',
    updatedAt: '2026-06-18T03:00:00.000Z',
    isDeleted: false,
  },
  {
    id: 'TE-003',
    storeId: 'store-001',
    storeName: 'Fit365八潮店',
    name: 'トレッドミル TM-500',
    mstToolId: TOOL_ID.machine,
    quantity: 3,
    locationInGym: 'aerobic_area',
    manufacturer: 'テクノジム',
    model: 'TM-500X',
    installedOn: '2022-01-15',
    installationStatus: 'installed',
    note: null,
    statusChangedAt: '2026-02-01T00:00:00.000Z',
    statusChangedByName: '田中花子',
    createdAt: '2022-01-15T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    isDeleted: false,
  },
  {
    id: 'TE-004',
    storeId: 'store-001',
    storeName: 'Fit365八潮店',
    name: 'バーベルセット 20-120kg',
    mstToolId: TOOL_ID.barbell,
    quantity: 2,
    locationInGym: 'free_weight_area',
    manufacturer: 'アイロテック',
    model: 'BS-120PRO',
    installedOn: '2021-08-20',
    installationStatus: 'removed',
    note: null,
    statusChangedAt: '2026-03-10T00:00:00.000Z',
    statusChangedByName: '山田太郎',
    createdAt: '2021-08-20T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    isDeleted: false,
  },
  {
    id: 'TE-005',
    storeId: 'store-001',
    storeName: 'Fit365八潮店',
    name: 'スミスマシン SM-200',
    mstToolId: TOOL_ID.smithMachine,
    quantity: 1,
    locationInGym: 'free_weight_area',
    manufacturer: 'ハンマーストレングス',
    model: 'SM-200X',
    installedOn: '2020-12-01',
    installationStatus: 'discarded',
    note: null,
    statusChangedAt: '2025-12-01T00:00:00.000Z',
    statusChangedByName: '佐藤一郎',
    createdAt: '2020-12-01T00:00:00.000Z',
    updatedAt: '2025-12-01T00:00:00.000Z',
    isDeleted: false,
  },
];

/**
 * FR-011 history seed (read-only in Phase 1). `previousStatus` is null on the initial registration row.
 */
export const SEED_TRAINING_EQUIPMENT_HISTORY: TrainingEquipmentStatusHistoryRow[] = [
  {
    id: 'TH-006',
    equipmentId: 'TE-001',
    changedAt: '2026-06-24T09:00:00.000Z',
    changedByName: '田中花子',
    previousStatus: 'installed',
    newStatus: 'maintenance',
    changedReason: 'ケーブル系統の摩耗確認、点検のためメンテナンス中に変更',
  },
  {
    id: 'TH-005',
    equipmentId: 'TE-001',
    changedAt: '2026-01-20T05:00:00.000Z',
    changedByName: '山田太郎',
    previousStatus: 'maintenance',
    newStatus: 'installed',
    changedReason: '動作確認・ワイヤー点検。摩耗を確認、交換推奨',
  },
  {
    id: 'TH-004',
    equipmentId: 'TE-001',
    changedAt: '2025-10-16T07:00:00.000Z',
    changedByName: '田中花子',
    previousStatus: 'maintenance',
    newStatus: 'installed',
    changedReason: '部品交換完了、動作確認OK',
  },
  {
    id: 'TH-003',
    equipmentId: 'TE-001',
    changedAt: '2025-10-15T01:30:00.000Z',
    changedByName: '田中花子',
    previousStatus: 'installed',
    newStatus: 'maintenance',
    changedReason: 'シートクッション交換・滑車グリスアップ',
  },
  {
    id: 'TH-002',
    equipmentId: 'TE-001',
    changedAt: '2025-04-05T23:15:00.000Z',
    changedByName: '佐藤一郎',
    previousStatus: 'removed',
    newStatus: 'installed',
    changedReason: '新モデル導入完了、旧マシンから入替のうえ設置',
  },
  {
    id: 'TH-001',
    equipmentId: 'TE-001',
    changedAt: '2023-05-01T00:00:00.000Z',
    changedByName: '佐藤一郎',
    previousStatus: null,
    newStatus: 'installed',
    changedReason: '新規設置登録',
  },
  {
    id: 'TH-011',
    equipmentId: 'TE-004',
    changedAt: '2026-03-10T00:00:00.000Z',
    changedByName: '山田太郎',
    previousStatus: 'installed',
    newStatus: 'removed',
    changedReason: '旧マシン一時撤去。新モデル導入後に復旧予定',
  },
  // Initial registration rows. `changedReason` is NOT NULL, so every record carries a 「新規登録」 reason.
  {
    id: 'TH-021',
    equipmentId: 'TE-002',
    changedAt: '2024-04-11T00:00:00.000Z',
    changedByName: '山田太郎',
    previousStatus: null,
    newStatus: 'installed',
    changedReason: '新規登録',
  },
  {
    id: 'TH-022',
    equipmentId: 'TE-003',
    changedAt: '2022-01-15T00:00:00.000Z',
    changedByName: '田中花子',
    previousStatus: null,
    newStatus: 'installed',
    changedReason: '新規登録',
  },
  {
    id: 'TH-023',
    equipmentId: 'TE-004',
    changedAt: '2021-08-20T00:00:00.000Z',
    changedByName: '山田太郎',
    previousStatus: null,
    newStatus: 'installed',
    changedReason: '新規登録',
  },
  {
    id: 'TH-024',
    equipmentId: 'TE-005',
    changedAt: '2020-12-01T00:00:00.000Z',
    changedByName: '佐藤一郎',
    previousStatus: null,
    newStatus: 'installed',
    changedReason: '新規登録',
  },
];

export const SEED_TRAINING_EQUIPMENT_LINKS: TrainingEquipmentExerciseLinkRow[] = [
  { equipmentId: 'TE-001', exerciseId: 'EX-011', createdAt: '2026-01-01T00:00:00.000Z' },
  { equipmentId: 'TE-001', exerciseId: 'EX-013', createdAt: '2026-01-01T00:00:00.000Z' },
];

/**
 * The Y-08 tool-type master is numbered by `exercise-master.table.ts` following the seed array order
 * (`tool[2]` → `TOOL-003`). This bridges an exercise's `toolId` to the equipment-side `mst_tools`.
 */
const TOOL_CODE_BY_EXERCISE_MASTER_ID = new Map<string, TrainingEquipmentToolType>(
  EXERCISE_MASTER_SEEDS.tool.map((tool, index) => [
    `${EXERCISE_MASTER_KIND_PREFIX.tool}-${String(index + 1).padStart(3, '0')}`,
    tool.code as TrainingEquipmentToolType,
  ]),
);

/**
 * The Y-08 exercise master (`SEED_EXERCISES`) is the single source of truth for candidates: id, name,
 * code and tool type all come from it, so `/exercises/[id]` linked from the equipment detail always
 * exists. Difficulty and body part have no Y-08 master, so they live here for this list's display.
 */
function candidate(
  exerciseId: string,
  difficulty: string,
  bodyPart: string,
): TrainingEquipmentExerciseCatalogItem {
  const exercise = SEED_EXERCISES.find((row) => row.id === exerciseId);
  if (!exercise) {
    throw new Error(
      `[training-equipment.seed] 候補 ${exerciseId} が SEED_EXERCISES に存在しません（リンク先が 404 になります）`,
    );
  }
  const toolCode = TOOL_CODE_BY_EXERCISE_MASTER_ID.get(exercise.toolId);

  return {
    exerciseId: exercise.id,
    exerciseCode: exercise.exerciseCode,
    name: exercise.nameJa,
    mstToolId: toolCode ? TOOL_ID[toolCode] : TOOL_ID.other,
    difficulty,
    bodyPart,
  };
}

export const TRAINING_EQUIPMENT_EXERCISE_CATALOG: TrainingEquipmentExerciseCatalogItem[] = [
  candidate('EX-011', '中級', '背中'),
  candidate('EX-012', '中級', '背中'),
  candidate('EX-013', '中級', '背中'),
  candidate('EX-014', '上級', '背中'),
  candidate('EX-015', '中級', '肩'),
  candidate('EX-016', '初級', '腕'),
  candidate('EX-017', '初級', '腕'),
  candidate('EX-018', '上級', '胸'),
  candidate('EX-019', '中級', '肩'),
  candidate('EX-020', '中級', '脚'),
  candidate('EX-021', '上級', '背中'),
  candidate('EX-022', '中級', '胸'),
  candidate('EX-023', '初級', '腕'),
];
