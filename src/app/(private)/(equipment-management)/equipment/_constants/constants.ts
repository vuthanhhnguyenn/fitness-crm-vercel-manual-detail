import type { GetCrmEquipmentResponse } from '@/lib/api/types.gen';

type EquipmentListItem = GetCrmEquipmentResponse['items'][number];

export type EquipmentStatus = EquipmentListItem['status'];
export type EquipmentType = EquipmentListItem['equipment_type'];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  entry_gate: '入退館ゲート',
  hydrogen_water_server: '水素水サーバー',
  body_composition_monitor: '体組成計',
  tanning_machine: 'タンニングマシン',
  protein_server: 'プロテインサーバー',
  other: 'その他',
};

export type EquipmentAuthenticationMethod = EquipmentListItem['authentication_method'];

export const EQUIPMENT_AUTHENTICATION_LABELS: Record<EquipmentAuthenticationMethod, string> = {
  member_qr_scan: '会員読取型',
  device_qr_scan: '機器読取型',
  none: 'なし',
};

export const EQUIPMENT_CONTRACT_LINK_TYPE_LABELS: Record<'main' | 'option' | 'per_use', string> = {
  main: 'メイン契約',
  option: 'オプション契約',
  per_use: '都度利用',
};

// 利用制御ルール (FR-008) option lists — sourced from the prototype Selects
export const EQUIPMENT_MAIN_CONTRACT_TYPE_OPTIONS = [
  'スタンダード',
  'プレミアム',
  'ライト',
] as const;

export const EQUIPMENT_OPTION_TYPE_OPTIONS = [
  '水素水',
  'プロテイン',
  'タンニング',
  'その他',
] as const;

export const EQUIPMENT_PER_USE_OPTION_TYPE_OPTIONS = [
  '水素水都次',
  'プロテイン都次',
  'タンニング都次',
  'コラーゲン都次',
] as const;

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  normal: '正常',
  error: '異常',
  maintenance: 'メンテナンス中',
  discarded: '廃棄',
};

export const EQUIPMENT_STATUS_BADGE_MAP: Record<
  EquipmentStatus,
  { badgeClassName: string; dotClassName: string }
> = {
  normal: {
    badgeClassName: 'border-success/20 bg-success/15 text-success gap-1 text-xs font-medium',
    dotClassName: 'bg-success',
  },
  error: {
    badgeClassName:
      'border-destructive/20 bg-destructive/15 text-destructive gap-1 text-xs font-medium',
    dotClassName: 'bg-destructive',
  },
  maintenance: {
    badgeClassName: 'border-warning/20 bg-warning/15 text-warning gap-1 text-xs font-medium',
    dotClassName: 'bg-warning',
  },
  discarded: {
    badgeClassName:
      'border-muted-foreground/20 bg-muted text-muted-foreground gap-1 text-xs font-medium',
    dotClassName: 'bg-muted-foreground',
  },
};
