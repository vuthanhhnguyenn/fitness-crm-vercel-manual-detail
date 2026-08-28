import type {
  RoutineBrand,
  RoutinePublishStatus,
  RoutineSetType,
} from '@/app/api/_schemas/routine.schema';

export type RoutineSetRecord = {
  setNumber: number;
  setType: RoutineSetType;
  supersetGroup: string | null;
  targetWeightKg: number | null;
  targetReps: number | null;
  targetDurationSeconds: number | null;
  targetDistanceM: number | null;
  targetRpe: number | null;
};

export type RoutineExerciseRecord = {
  exerciseId: string;
  sortOrder: number;
  hqComment: string | null;
  sets: RoutineSetRecord[];
};

export type RoutineRecord = {
  id: string;
  routineCode: string;
  name: string;
  description: string | null;
  categoryId: string;
  brandEnum: RoutineBrand;
  thumbnailS3Keys: string[];
  origin: 'official';
  sourceRoutineId: string | null;
  isPublic: boolean;
  publishStatus: RoutinePublishStatus;
  publishedAt: string | null;
  exercises: RoutineExerciseRecord[];
  deletedAt: string | null;
  createdByStaffId: string;
  updatedByStaffId: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
};

// 器具種別コード（Y-08 exerciseMasters(tool).code）→ セット追加時の推奨重量デフォルト（research.md R5）
export const DEFAULT_WEIGHT_BY_TOOL_CODE: Record<string, number> = {
  none: 0,
  machine: 10,
  cableMachine: 10,
  smithMachine: 20,
  barbell: 20,
  dumbbell: 5,
  kettlebell: 8,
  resistanceBand: 0,
  trx: 0,
  other: 0,
};

const THUMBNAIL_POOL = [
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop',
];

function normalSet(
  setNumber: number,
  values: Partial<Omit<RoutineSetRecord, 'setNumber' | 'setType' | 'supersetGroup'>>,
): RoutineSetRecord {
  return {
    setNumber,
    setType: 'normal',
    supersetGroup: null,
    targetWeightKg: values.targetWeightKg ?? null,
    targetReps: values.targetReps ?? null,
    targetDurationSeconds: values.targetDurationSeconds ?? null,
    targetDistanceM: values.targetDistanceM ?? null,
    targetRpe: values.targetRpe ?? null,
  };
}

export const SEED_ROUTINES: RoutineRecord[] = [
  {
    id: 'RT-001',
    routineCode: 'RT-00001',
    name: '全身トレーニング（初心者向け）',
    description: '初めての方向けに、上半身と下半身をバランスよく鍛える全身プログラムです。',
    categoryId: 'RC-001',
    brandEnum: 'joyfit',
    thumbnailS3Keys: [THUMBNAIL_POOL[0]!, THUMBNAIL_POOL[1]!],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: true,
    publishStatus: 'published',
    publishedAt: '2026-03-01T00:00:00Z',
    exercises: [
      {
        exerciseId: 'EX-001',
        sortOrder: 0,
        hqComment: '肩甲骨を寄せて胸を張ること。肘を90度以下に曲げないよう注意。',
        sets: [
          normalSet(1, { targetReps: 10, targetWeightKg: 20, targetRpe: 6 }),
          normalSet(2, { targetReps: 10, targetWeightKg: 20, targetRpe: 7 }),
        ],
      },
      {
        exerciseId: 'EX-002',
        sortOrder: 1,
        hqComment: null,
        sets: [normalSet(1, { targetReps: 12, targetWeightKg: 40, targetRpe: 6 })],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-001',
    updatedByName: '本部 花子',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'RT-002',
    routineCode: 'RT-00002',
    name: '上半身集中プログラム',
    description: '胸・背中・腕を重点的に鍛える上半身特化のトレーニングプログラムです。',
    categoryId: 'RC-005',
    brandEnum: 'joyfit',
    thumbnailS3Keys: [THUMBNAIL_POOL[0]!, THUMBNAIL_POOL[1]!, THUMBNAIL_POOL[2]!],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: true,
    publishStatus: 'published',
    publishedAt: '2026-03-05T00:00:00Z',
    exercises: [
      {
        exerciseId: 'EX-001',
        sortOrder: 0,
        hqComment: '肩甲骨を寄せて胸を張ること。',
        sets: [
          normalSet(1, { targetReps: 10, targetWeightKg: 60, targetRpe: 7 }),
          normalSet(2, { targetReps: 8, targetWeightKg: 65, targetRpe: 8 }),
        ],
      },
      {
        exerciseId: 'EX-002',
        sortOrder: 1,
        hqComment: null,
        sets: [normalSet(1, { targetReps: 12, targetWeightKg: 50, targetRpe: 7 })],
      },
      {
        exerciseId: 'EX-004',
        sortOrder: 2,
        hqComment: 'ストレッチポジションでの伸張を意識する。',
        sets: [normalSet(1, { targetReps: 15, targetWeightKg: 20, targetRpe: 6 })],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-002',
    updatedByName: '本部 太郎',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'RT-003',
    routineCode: 'RT-00003',
    name: '下半身強化ルーティン',
    description: '脚・臀部を集中的に鍛える下半身プログラム。',
    categoryId: 'RC-006',
    brandEnum: 'fit365',
    thumbnailS3Keys: [THUMBNAIL_POOL[2]!],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: true,
    publishStatus: 'published',
    publishedAt: '2026-03-10T00:00:00Z',
    exercises: [
      {
        exerciseId: 'EX-002',
        sortOrder: 0,
        hqComment: '膝がつま先より前に出ないよう注意。',
        sets: [
          normalSet(1, { targetReps: 10, targetWeightKg: 60, targetRpe: 7 }),
          normalSet(2, { targetReps: 10, targetWeightKg: 60, targetRpe: 7 }),
          normalSet(3, { targetReps: 8, targetWeightKg: 70, targetRpe: 8 }),
        ],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-001',
    updatedByName: '本部 花子',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'RT-004',
    routineCode: 'RT-00004',
    name: '自重トレーニング（入門）',
    description: '器具を使わず自重で行える体幹中心のプログラム。',
    categoryId: 'RC-001',
    brandEnum: 'joyfit',
    thumbnailS3Keys: [],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: true,
    publishStatus: 'published',
    publishedAt: '2026-03-08T00:00:00Z',
    exercises: [
      {
        exerciseId: 'EX-003',
        sortOrder: 0,
        hqComment: '腰が落ちないよう体幹を一直線に保つ。呼吸を止めない。',
        sets: [
          normalSet(1, { targetDurationSeconds: 90, targetRpe: 5 }),
          normalSet(2, { targetDurationSeconds: 90, targetRpe: 6 }),
          normalSet(3, { targetDurationSeconds: 60, targetRpe: 7 }),
        ],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-001',
    updatedByName: '本部 花子',
    createdAt: '2026-03-08T00:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
  },
  {
    id: 'RT-005',
    routineCode: 'RT-00005',
    name: '脂肪燃焼サーキット',
    description: '高回数・短インターバルで脂肪燃焼を促すサーキットプログラム。',
    categoryId: 'RC-003',
    brandEnum: 'joyfit',
    thumbnailS3Keys: [THUMBNAIL_POOL[1]!],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: false,
    publishStatus: 'unpublished',
    publishedAt: null,
    exercises: [
      {
        exerciseId: 'EX-001',
        sortOrder: 0,
        hqComment: null,
        sets: [normalSet(1, { targetReps: 15, targetWeightKg: 30, targetRpe: 6 })],
      },
      {
        exerciseId: 'EX-002',
        sortOrder: 1,
        hqComment: null,
        sets: [normalSet(1, { targetReps: 15, targetWeightKg: 30, targetRpe: 6 })],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-002',
    updatedByStaffId: 'STF-002',
    updatedByName: '本部 太郎',
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-08T13:00:00Z',
  },
  {
    id: 'RT-006',
    routineCode: 'RT-00006',
    name: '体幹強化プログラム',
    description: null,
    categoryId: 'RC-004',
    brandEnum: 'joyfit',
    thumbnailS3Keys: [],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: false,
    publishStatus: 'unpublished',
    publishedAt: null,
    // Y-09 FR-007: エクササイズ0件は公開不可（0件公開ガードの確認用データ）
    exercises: [],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-001',
    updatedByName: '本部 花子',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  },
  {
    id: 'RT-007',
    routineCode: 'RT-00007',
    name: 'ボディシェイプ 12週',
    description: '12週間かけて体型を整える中級者向けプログラム。',
    categoryId: 'RC-002',
    brandEnum: 'fit365',
    thumbnailS3Keys: [THUMBNAIL_POOL[0]!],
    origin: 'official',
    sourceRoutineId: null,
    isPublic: true,
    publishStatus: 'published',
    publishedAt: '2026-02-28T00:00:00Z',
    exercises: [
      {
        exerciseId: 'EX-002',
        sortOrder: 0,
        hqComment: null,
        sets: [normalSet(1, { targetReps: 12, targetWeightKg: 40, targetRpe: 7 })],
      },
    ],
    deletedAt: null,
    createdByStaffId: 'STF-001',
    updatedByStaffId: 'STF-001',
    updatedByName: '本部 花子',
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-02-28T15:00:00Z',
  },
];
