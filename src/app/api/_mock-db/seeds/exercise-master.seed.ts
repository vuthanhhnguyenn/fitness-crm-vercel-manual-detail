import type {
  ExerciseMasterDetail,
  ExerciseMasterKind,
} from '@/app/api/_schemas/exercise-master.schema';

export type MasterSeedInput = {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
};

export type ExerciseMasterRecord = ExerciseMasterDetail & {
  deletedAt: string | null;
};

export const EXERCISE_MASTER_KIND_PREFIX: Record<ExerciseMasterKind, string> = {
  category: 'CAT',
  muscle: 'MSC',
  tool: 'TOOL',
  exercise_type: 'ET',
};

export const EXERCISE_MASTER_KIND_LABEL: Record<ExerciseMasterKind, string> = {
  category: 'カテゴリ',
  muscle: '筋肉部位',
  tool: '器具種別',
  exercise_type: 'エクササイズタイプ',
};

export const EXERCISE_MASTER_SEEDS: Record<ExerciseMasterKind, MasterSeedInput[]> = {
  category: [
    {
      code: 'cat-chest',
      name: '胸',
      description: '大胸筋を主体とした胸部のトレーニング種目',
      sortOrder: 1,
    },
    {
      code: 'cat-back',
      name: '背中',
      description: '広背筋・僧帽筋を主体とした背面のトレーニング種目',
      sortOrder: 2,
    },
    {
      code: 'cat-shoulder',
      name: '肩',
      description: '三角筋を主体とした肩のトレーニング種目',
      sortOrder: 3,
    },
    {
      code: 'cat-biceps-forearm',
      name: '二頭前腕',
      description: '上腕二頭筋・前腕筋を主体とした種目',
      sortOrder: 4,
    },
    { code: 'cat-triceps', name: '三頭', description: '上腕三頭筋を主体とした種目', sortOrder: 5 },
    {
      code: 'cat-legs',
      name: '脚',
      description: '大腿四頭筋・ハムストリング・大臀筋を主体とした脚部の種目',
      sortOrder: 6,
    },
    {
      code: 'cat-abs',
      name: '腹筋',
      description: '腹直筋・腹斜筋を主体とした体幹の種目',
      sortOrder: 7,
    },
    {
      code: 'cat-cardio',
      name: '有酸素',
      description: '心肺機能向上を目的とした有酸素運動種目',
      sortOrder: 8,
    },
    {
      code: 'cat-weightlifting',
      name: '重量上げ',
      description: 'クリーン・スナッチ等のオリンピックリフティング種目',
      sortOrder: 9,
    },
    { code: 'cat-other', name: '他', description: '上記カテゴリに分類されない種目', sortOrder: 10 },
  ],
  muscle: [
    {
      code: 'muscle-pec-major',
      name: '大胸筋',
      description: '胸部を覆う大きな筋肉。ベンチプレス・フライで主に使用',
      sortOrder: 1,
    },
    {
      code: 'muscle-lat',
      name: '広背筋',
      description: '背中最大の筋肉。プルダウン・ローイングで主に使用',
      sortOrder: 2,
    },
    {
      code: 'muscle-deltoid',
      name: '三角筋',
      description: '肩を覆う筋肉。ショルダープレス・サイドレイズで主に使用',
      sortOrder: 3,
    },
    {
      code: 'muscle-biceps',
      name: '上腕二頭筋',
      description: '腕の前面にある筋肉。カール系種目で主に使用',
      sortOrder: 4,
    },
    {
      code: 'muscle-triceps',
      name: '上腕三頭筋',
      description: '腕の後面にある筋肉。プレス・エクステンション系で主に使用',
      sortOrder: 5,
    },
    {
      code: 'muscle-quads',
      name: '大腿四頭筋',
      description: '太ももの前面にある筋肉。スクワット・レッグプレスで主に使用',
      sortOrder: 6,
    },
    {
      code: 'muscle-hamstrings',
      name: 'ハムストリング',
      description: '太ももの後面にある筋肉。デッドリフト・レッグカールで主に使用',
      sortOrder: 7,
    },
    {
      code: 'muscle-glutes',
      name: '大臀筋',
      description: '臀部の最大の筋肉。スクワット・ヒップスラストで主に使用',
      sortOrder: 8,
    },
    {
      code: 'muscle-abs',
      name: '腹直筋',
      description: '腹部の前面にある筋肉。クランチ・レッグレイズで主に使用',
      sortOrder: 9,
    },
    {
      code: 'muscle-erector-spinae',
      name: '脊柱起立筋',
      description: '背骨に沿って走る筋肉群。デッドリフト・バックエクステンションで主に使用',
      sortOrder: 10,
    },
  ],
  tool: [
    {
      code: 'none',
      name: 'なし（自重）',
      description: '器具を使わず自体重のみで行う種目',
      sortOrder: 1,
    },
    {
      code: 'machine',
      name: 'マシン',
      description: '固定されたマシンを使用する種目',
      sortOrder: 2,
    },
    {
      code: 'cableMachine',
      name: 'ケーブル',
      description: 'ケーブルマシンを使用する種目',
      sortOrder: 3,
    },
    {
      code: 'smithMachine',
      name: 'スミスマシン',
      description: 'スミスマシンを使用する種目',
      sortOrder: 4,
    },
    { code: 'barbell', name: 'バーベル', description: 'バーベルを使用する種目', sortOrder: 5 },
    {
      code: 'dumbbell',
      name: 'ダンベル',
      description: 'ダンベルを使用する種目',
      sortOrder: 6,
    },
    {
      code: 'kettlebell',
      name: 'ケトルベル',
      description: 'ケトルベルを使用する種目',
      sortOrder: 7,
    },
    {
      code: 'resistanceBand',
      name: 'ゴムバンド',
      description: 'ゴムバンド（レジスタンスバンド）を使用する種目',
      sortOrder: 8,
    },
    {
      code: 'trx',
      name: 'TRX',
      description: 'TRXサスペンショントレーナーを使用する種目',
      sortOrder: 9,
    },
    {
      code: 'other',
      name: 'その他',
      description: '上記に分類されないその他の器具',
      sortOrder: 10,
    },
  ],
  exercise_type: [
    {
      code: 'type-weight-reps',
      name: '重さ＆回数',
      description: '重量と回数でボリュームを記録するタイプ（例: ベンチプレス 60kg × 10回）',
      sortOrder: 1,
    },
    {
      code: 'type-bodyweight-reps',
      name: '自重＆回数',
      description: '自体重での回数のみ記録するタイプ（例: 腕立て伏せ 20回）',
      sortOrder: 2,
    },
    {
      code: 'type-weighted-bodyweight-reps',
      name: '自重（荷重）＆回数',
      description: '自体重に重りを追加した回数記録タイプ（例: ウェイテッドプルアップ +10kg × 8回）',
      sortOrder: 3,
    },
    {
      code: 'type-assisted-bodyweight-reps',
      name: '自重（補助）＆回数',
      description:
        '補助器具を使った自体重種目の回数記録タイプ（例: アシステッドプルアップ -20kg × 10回）',
      sortOrder: 4,
    },
    {
      code: 'type-duration',
      name: '時間',
      description: '時間のみでボリュームを記録するタイプ（例: プランク 60秒）',
      sortOrder: 5,
    },
    {
      code: 'type-duration-weight',
      name: '時間＆重さ',
      description: '時間と重量を組み合わせて記録するタイプ（例: ファーマーズウォーク 20kg × 30秒）',
      sortOrder: 6,
    },
  ],
};
