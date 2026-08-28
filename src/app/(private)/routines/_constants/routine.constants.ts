import type { RoutinePublishStatus } from '@/lib/api/types.gen';

export const ROUTINE_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const ROUTINE_DEFAULT_PAGE_SIZE = 50;

export const ROUTINE_PUBLISH_STATUS_LABELS: Record<RoutinePublishStatus, string> = {
  published: '公開',
  unpublished: '非公開',
};

// Y-09 FR-008/FR-009: セット追加時の器具別デフォルト推奨重量（research.md R5）。
// エクササイズピッカーの toolName（Y-08 器具種別マスタ名）でキーする。未マップは 0。
export const DEFAULT_WEIGHT_BY_TOOL_NAME: Record<string, number> = {
  'なし（自重）': 0,
  マシン: 10,
  ケーブル: 10,
  スミスマシン: 20,
  バーベル: 20,
  ダンベル: 5,
  ケトルベル: 8,
  ゴムバンド: 0,
  TRX: 0,
  その他: 0,
};

export function getDefaultWeightByToolName(toolName: string | undefined | null): number {
  if (!toolName) return 0;
  return DEFAULT_WEIGHT_BY_TOOL_NAME[toolName] ?? 0;
}

// セット追加時の共通デフォルト値（FR-008: Rep数:10 / 時間:90秒 / RPE:0）
export const ROUTINE_SET_DEFAULTS = {
  reps: '10',
  time: '90',
  rpe: '0',
} as const;

// FR-009 異常系: 推奨Rep数・推奨重量は0以上（E-RTN-005 とメッセージを揃える）
export const ROUTINE_SET_VALIDATION_MESSAGE =
  '推奨Rep数・重量・時間・距離は0以上の数値で入力してください';

// サーバー側 UpsertRoutineSetInputSchema の targetRpe: min(0).max(10) と揃える
export const ROUTINE_RPE_VALIDATION_MESSAGE = 'RPEは0〜10の範囲で入力してください';

// サーバー側 E-VAL-001 とメッセージを揃える
export const ROUTINE_DUPLICATE_EXERCISE_MESSAGE =
  '同じエクササイズを重複して追加することはできません';

// 編集中にエクササイズを0件にしても公開トグルは自動変更せず、保存時にこのエラーで止める
export const ROUTINE_PUBLISH_REQUIRES_EXERCISE_MESSAGE =
  '公開するにはエクササイズを1件以上登録してください';

export function getRoutinePublishStatusBadgeClass(status: RoutinePublishStatus): string {
  return status === 'published'
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-muted text-muted-foreground border-muted-foreground/20';
}

export function getRoutinePublishStatusDotClass(status: RoutinePublishStatus): string {
  return status === 'published' ? 'bg-success' : 'bg-muted-foreground';
}
