import type {
  ExerciseDetail,
  ExerciseHandUsage,
  ExerciseLevel,
  ExerciseStatus,
  ExerciseStep,
  ExerciseTagSetting,
} from '@/app/api/_schemas/exercise.schema';

export type ExerciseRecord = {
  id: string;
  exerciseCode: string;
  nameJa: string;
  nameEn: string | null;
  overviewJa: string | null;
  overviewEn: string | null;
  categoryId: string;
  primaryMuscleId: string;
  secondaryMuscleIds: string[];
  toolId: string;
  exerciseTypeId: string;
  handUsage: ExerciseHandUsage;
  level: ExerciseLevel;
  restSeconds: number;
  publishStatus: ExerciseStatus;
  updatedAt: string;
  updatedBy: string;
  videoUrl: string | null;
  images: ExerciseDetail['images'];
  explanationSteps: ExerciseStep[];
  linkedEquipmentIds: string[];
  relatedExerciseIds: string[];
  enabledTagIds: string[];
  deletedAt: string | null;
  routineUsageCount: number;
};

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
] satisfies readonly Pick<ExerciseTagSetting, 'id' | 'label' | 'category'>[];

export const EXERCISE_LEVELS: Array<{ value: ExerciseLevel; label: string }> = [
  { value: 'beginner', label: 'ビギナー' },
  { value: 'expert', label: 'エキスパート' },
];

export const EXERCISE_HAND_USAGES: Array<{ value: ExerciseHandUsage; label: string }> = [
  { value: 'both_hands', label: '両手' },
  { value: 'single_hand', label: '片手' },
  { value: 'both_feet', label: '両足' },
  { value: 'single_leg', label: '片足' },
];

export const EXERCISE_STATUSES: Array<{ value: ExerciseStatus; label: string }> = [
  { value: 'public', label: '公開' },
  { value: 'private', label: '非公開' },
];

export const EXERCISE_STEP_LABELS = [
  'トレーニングポイント',
  '開始姿勢',
  '動作説明',
  '最終姿勢',
  '戻し動作',
] as const;

const DEFAULT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
];

type CatalogExerciseInput = Pick<
  ExerciseRecord,
  'id' | 'nameJa' | 'nameEn' | 'categoryId' | 'primaryMuscleId' | 'toolId' | 'level'
> &
  Partial<
    Pick<
      ExerciseRecord,
      'secondaryMuscleIds' | 'exerciseTypeId' | 'restSeconds' | 'linkedEquipmentIds'
    >
  >;

/**
 * Exercises referenced by the training-equipment (TE-010) link catalog.
 * If one existed only in the catalog, `/exercises/[id]` linked from the equipment detail would 404,
 * so the Y-08 master must always hold a real record with the same id.
 */
function catalogExercise(input: CatalogExerciseInput): ExerciseRecord {
  const sequence = input.id.replace('EX-', '');

  return {
    id: input.id,
    exerciseCode: `EX-${sequence.padStart(5, '0')}`,
    nameJa: input.nameJa,
    nameEn: input.nameEn,
    overviewJa: `${input.nameJa}の概要です。`,
    overviewEn: null,
    categoryId: input.categoryId,
    primaryMuscleId: input.primaryMuscleId,
    secondaryMuscleIds: input.secondaryMuscleIds ?? [],
    toolId: input.toolId,
    exerciseTypeId: input.exerciseTypeId ?? 'ET-001',
    handUsage: 'both_hands',
    level: input.level,
    restSeconds: input.restSeconds ?? 60,
    publishStatus: 'public',
    updatedAt: '2026-06-15T09:00:00Z',
    updatedBy: '本部 花子',
    videoUrl: null,
    images: DEFAULT_IMAGE_POOL.slice(0, 1).map((url, index) => ({
      id: `IMG-${sequence}-${index}`,
      url,
      sortOrder: index,
      isPrimary: index === 0,
    })),
    explanationSteps: EXERCISE_STEP_LABELS.map((label, step) => ({
      step,
      label,
      textJa: `${input.nameJa}の${label}です。`,
      textEn: null,
      isMissing: false,
    })),
    linkedEquipmentIds: input.linkedEquipmentIds ?? [],
    relatedExerciseIds: [],
    enabledTagIds: [],
    deletedAt: null,
    routineUsageCount: 0,
  };
}

/**
 * `TRAINING_EQUIPMENT_EXERCISE_CATALOG` in `training-equipment.seed.ts` reads name, code and tool
 * type from this array, so changing an id affects both screens.
 */
const CATALOG_EXERCISES: ExerciseRecord[] = [
  catalogExercise({
    id: 'EX-011',
    nameJa: 'ラットプルダウン（ワイドグリップ）',
    nameEn: 'Lat Pulldown (Wide Grip)',
    categoryId: 'CAT-002',
    primaryMuscleId: 'MSC-002',
    secondaryMuscleIds: ['MSC-004'],
    toolId: 'TOOL-003',
    level: 'expert',
    restSeconds: 90,
    // Same link as SEED_TRAINING_EQUIPMENT_LINKS (TE-001 lat pulldown, LP-100).
    linkedEquipmentIds: ['TE-001'],
  }),
  catalogExercise({
    id: 'EX-012',
    nameJa: 'ラットプルダウン（ナローグリップ）',
    nameEn: 'Lat Pulldown (Narrow Grip)',
    categoryId: 'CAT-002',
    primaryMuscleId: 'MSC-002',
    secondaryMuscleIds: ['MSC-004'],
    toolId: 'TOOL-003',
    level: 'expert',
    restSeconds: 90,
  }),
  catalogExercise({
    id: 'EX-013',
    nameJa: 'シーテッドケーブルロウ',
    nameEn: 'Seated Cable Row',
    categoryId: 'CAT-002',
    primaryMuscleId: 'MSC-002',
    secondaryMuscleIds: ['MSC-004'],
    toolId: 'TOOL-003',
    level: 'expert',
    restSeconds: 90,
    linkedEquipmentIds: ['TE-001'],
  }),
  catalogExercise({
    id: 'EX-014',
    nameJa: 'ストレートアームプルダウン',
    nameEn: 'Straight Arm Pulldown',
    categoryId: 'CAT-002',
    primaryMuscleId: 'MSC-002',
    secondaryMuscleIds: ['MSC-005'],
    toolId: 'TOOL-003',
    level: 'expert',
  }),
  catalogExercise({
    id: 'EX-015',
    nameJa: 'フェイスプル',
    nameEn: 'Face Pull',
    categoryId: 'CAT-003',
    primaryMuscleId: 'MSC-003',
    secondaryMuscleIds: ['MSC-002'],
    toolId: 'TOOL-003',
    level: 'expert',
  }),
  catalogExercise({
    id: 'EX-016',
    nameJa: 'トライセプスプッシュダウン',
    nameEn: 'Triceps Pushdown',
    categoryId: 'CAT-005',
    primaryMuscleId: 'MSC-005',
    toolId: 'TOOL-003',
    level: 'beginner',
  }),
  catalogExercise({
    id: 'EX-017',
    nameJa: 'バイセプスカール（ケーブル）',
    nameEn: 'Cable Biceps Curl',
    categoryId: 'CAT-004',
    primaryMuscleId: 'MSC-004',
    toolId: 'TOOL-003',
    level: 'beginner',
  }),
  catalogExercise({
    id: 'EX-018',
    nameJa: 'ケーブルクロスオーバー',
    nameEn: 'Cable Crossover',
    categoryId: 'CAT-001',
    primaryMuscleId: 'MSC-001',
    secondaryMuscleIds: ['MSC-003'],
    toolId: 'TOOL-003',
    level: 'expert',
    restSeconds: 90,
  }),
  catalogExercise({
    id: 'EX-019',
    nameJa: 'ケーブルリアデルト',
    nameEn: 'Cable Rear Delt Fly',
    categoryId: 'CAT-003',
    primaryMuscleId: 'MSC-003',
    secondaryMuscleIds: ['MSC-002'],
    toolId: 'TOOL-003',
    level: 'expert',
  }),
  catalogExercise({
    id: 'EX-020',
    nameJa: 'スクワット（バーベル）',
    nameEn: 'Barbell Squat',
    categoryId: 'CAT-006',
    primaryMuscleId: 'MSC-006',
    secondaryMuscleIds: ['MSC-008', 'MSC-007'],
    toolId: 'TOOL-005',
    level: 'expert',
    restSeconds: 120,
    linkedEquipmentIds: ['TE-004'],
  }),
  catalogExercise({
    id: 'EX-021',
    nameJa: 'デッドリフト（バーベル）',
    nameEn: 'Barbell Deadlift',
    categoryId: 'CAT-002',
    primaryMuscleId: 'MSC-010',
    secondaryMuscleIds: ['MSC-008', 'MSC-007'],
    toolId: 'TOOL-005',
    level: 'expert',
    restSeconds: 120,
    linkedEquipmentIds: ['TE-004'],
  }),
  catalogExercise({
    id: 'EX-022',
    nameJa: 'ベンチプレス（バーベル）',
    nameEn: 'Barbell Bench Press',
    categoryId: 'CAT-001',
    primaryMuscleId: 'MSC-001',
    secondaryMuscleIds: ['MSC-005', 'MSC-003'],
    toolId: 'TOOL-005',
    level: 'expert',
    restSeconds: 90,
    linkedEquipmentIds: ['TE-004'],
  }),
  catalogExercise({
    id: 'EX-023',
    nameJa: 'ダンベルカール',
    nameEn: 'Dumbbell Curl',
    categoryId: 'CAT-004',
    primaryMuscleId: 'MSC-004',
    toolId: 'TOOL-006',
    level: 'beginner',
    linkedEquipmentIds: ['TE-002'],
  }),
];

export const SEED_EXERCISES: ExerciseRecord[] = [
  {
    id: 'EX-001',
    exerciseCode: 'EX-00042',
    nameJa: 'ベンチプレス',
    nameEn: 'Bench Press',
    overviewJa:
      '胸の大胸筋を中心に、三角筋前部・上腕三頭筋を鍛えるコンパウンド種目です。フリーウェイトの王様とも呼ばれる基本的な上半身押しエクササイズです。',
    overviewEn:
      'A compound upper-body pressing exercise that targets the chest, front delts, and triceps.',
    categoryId: 'CAT-001',
    primaryMuscleId: 'MSC-001',
    secondaryMuscleIds: ['MSC-003', 'MSC-005'],
    toolId: 'TOOL-005',
    exerciseTypeId: 'ET-001',
    handUsage: 'both_hands',
    level: 'expert',
    restSeconds: 90,
    publishStatus: 'public',
    updatedAt: '2026-06-30T09:30:00Z',
    updatedBy: '山田 太郎',
    videoUrl: 'https://www.youtube.com/watch?v=example',
    images: DEFAULT_IMAGE_POOL.slice(0, 3).map((url, index) => ({
      id: `IMG-001-${index}`,
      url,
      sortOrder: index,
      isPrimary: index === 0,
    })),
    explanationSteps: [
      '胸を張り肩甲骨を寄せることで、大胸筋に正しく負荷がかかります。肩の怪我を防ぐため、肩を下げた状態を維持してください。',
      'ベンチに仰向けになり、バーベルを肩幅よりやや広めに握ります。足は床にしっかりとつけ、腰とベンチの間に自然なアーチを作ります。',
      '息を吸いながら、バーベルを胸の中央に向けてゆっくりと下ろします。',
      'バーベルが胸に軽く触れた状態。背中はアーチを保ち、肩甲骨は寄せたままにします。',
      '息を吐きながら、バーベルを元の位置まで力強く押し上げます。',
    ].map((textJa, step) => ({
      step,
      label: EXERCISE_STEP_LABELS[step]!,
      textJa,
      textEn: null,
      isMissing: false,
    })),
    linkedEquipmentIds: ['TE-004'],
    relatedExerciseIds: ['EX-004', 'EX-003'],
    enabledTagIds: ['grip-narrow', 'direction-underhand'],
    deletedAt: null,
    routineUsageCount: 2,
  },
  {
    id: 'EX-002',
    exerciseCode: 'EX-00043',
    nameJa: 'スクワット',
    nameEn: 'Squat',
    overviewJa: '下半身全体を鍛える代表的なコンパウンド種目です。',
    overviewEn: null,
    categoryId: 'CAT-006',
    primaryMuscleId: 'MSC-006',
    secondaryMuscleIds: ['MSC-008', 'MSC-007'],
    toolId: 'TOOL-005',
    exerciseTypeId: 'ET-001',
    handUsage: 'both_hands',
    level: 'expert',
    restSeconds: 120,
    publishStatus: 'public',
    updatedAt: '2026-06-28T08:15:00Z',
    updatedBy: '本部 花子',
    videoUrl: null,
    images: DEFAULT_IMAGE_POOL.slice(0, 2).map((url, index) => ({
      id: `IMG-002-${index}`,
      url,
      sortOrder: index,
      isPrimary: index === 0,
    })),
    explanationSteps: EXERCISE_STEP_LABELS.map((label, step) => ({
      step,
      label,
      textJa: `スクワットの${label}です。`,
      textEn: null,
      isMissing: false,
    })),
    linkedEquipmentIds: ['TE-004'],
    relatedExerciseIds: ['EX-001'],
    enabledTagIds: ['width-wide'],
    deletedAt: null,
    routineUsageCount: 0,
  },
  {
    id: 'EX-003',
    exerciseCode: 'EX-00044',
    nameJa: 'プランク',
    nameEn: 'Plank',
    overviewJa: '体幹を安定させる自重トレーニングです。',
    overviewEn: null,
    categoryId: 'CAT-007',
    primaryMuscleId: 'MSC-009',
    secondaryMuscleIds: ['MSC-010'],
    toolId: 'TOOL-001',
    exerciseTypeId: 'ET-005',
    handUsage: 'both_hands',
    level: 'beginner',
    restSeconds: 60,
    publishStatus: 'private',
    updatedAt: '2026-06-27T11:20:00Z',
    updatedBy: '本部 花子',
    videoUrl: 'https://example.com/plank',
    images: DEFAULT_IMAGE_POOL.slice(1, 2).map((url, index) => ({
      id: `IMG-003-${index}`,
      url,
      sortOrder: index,
      isPrimary: index === 0,
    })),
    explanationSteps: EXERCISE_STEP_LABELS.map((label, step) => ({
      step,
      label,
      textJa: step < 3 ? `プランクの${label}です。` : '',
      textEn: null,
      isMissing: step >= 3,
    })),
    linkedEquipmentIds: [],
    relatedExerciseIds: ['EX-001'],
    enabledTagIds: ['center-high'],
    deletedAt: null,
    routineUsageCount: 0,
  },
  {
    id: 'EX-004',
    exerciseCode: 'EX-00045',
    nameJa: 'ケーブルクロスオーバー',
    nameEn: 'Cable Crossover',
    overviewJa: '大胸筋を収縮位で刺激するケーブル種目です。',
    overviewEn: null,
    categoryId: 'CAT-001',
    primaryMuscleId: 'MSC-001',
    secondaryMuscleIds: ['MSC-003'],
    toolId: 'TOOL-003',
    exerciseTypeId: 'ET-001',
    handUsage: 'both_hands',
    level: 'expert',
    restSeconds: 90,
    publishStatus: 'private',
    updatedAt: '2026-06-20T06:05:00Z',
    updatedBy: '山田 太郎',
    videoUrl: null,
    images: [],
    explanationSteps: EXERCISE_STEP_LABELS.map((label, step) => ({
      step,
      label,
      textJa: `ケーブルクロスオーバーの${label}です。`,
      textEn: null,
      isMissing: false,
    })),
    linkedEquipmentIds: ['TE-001'],
    relatedExerciseIds: ['EX-001'],
    enabledTagIds: ['grip-wide'],
    deletedAt: null,
    routineUsageCount: 0,
  },
  ...CATALOG_EXERCISES,
];
