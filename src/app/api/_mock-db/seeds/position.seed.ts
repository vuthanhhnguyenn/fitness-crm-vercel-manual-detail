import type { Position } from '@/app/api/_schemas/position.schema';
import type { StaffListItem } from '@/app/api/_schemas/staff.schema';

export const SEED_POSITION_ROWS: Position[] = [
  {
    id: 1,
    role: 'headquarter',
    position_name: '本部管理者',
    features: { summary_ja: '全機能・全データ', scope: 'all' },
  },
  {
    id: 2,
    role: 'manager',
    position_name: 'ブロック長',
    features: { summary_ja: '複数エリア横断', scope: 'multi_area' },
  },
  {
    id: 3,
    role: 'manager',
    position_name: 'テリトリーマネージャー',
    features: { summary_ja: '複数店舗横断', scope: 'multi_store' },
  },
  {
    id: 4,
    role: 'manager',
    position_name: 'テリトリーMGR',
    features: { summary_ja: 'G-04運用型アンケート作成 (v2.3)', survey: 'G-04' },
  },
  {
    id: 5,
    role: 'staff',
    position_name: '店舗責任者',
    features: { summary_ja: '店舗運用・一部マネージャ権限', scope: 'store_admin' },
  },
  {
    id: 6,
    role: 'staff',
    position_name: '正社員スタッフ',
    features: { summary_ja: '日常店舗運用', scope: 'store_daily' },
  },
  {
    id: 7,
    role: 'staff',
    position_name: '契約社員スタッフ',
    features: { summary_ja: '日常店舗運用', scope: 'store_daily' },
  },
  {
    id: 8,
    role: 'staff',
    position_name: 'アルバイト（スーパー）',
    features: { summary_ja: '店舗業務広範囲', scope: 'store_wide' },
  },
  {
    id: 9,
    role: 'staff',
    position_name: 'アルバイト（一般）',
    features: { summary_ja: '店舗業務限定', scope: 'store_limited' },
  },
  {
    id: 10,
    role: 'staff',
    position_name: 'FC企業管理者',
    features: { summary_ja: '管轄FC店舗参照・Y-03', scope: 'fc_admin' },
  },
  {
    id: 11,
    role: 'trainer',
    position_name: '社員トレーナー',
    features: { summary_ja: 'レッスン運用特化', scope: 'lesson' },
  },
  {
    id: 12,
    role: 'trainer',
    position_name: '社外トレーナー',
    features: { summary_ja: 'レッスン運用（外部認証）', scope: 'lesson_external' },
  },
  {
    id: 13,
    role: 'observer',
    position_name: '閲覧専任',
    features: { summary_ja: '参照のみ', scope: 'read_only' },
  },
];

export function positionNameById(id: number): string {
  return SEED_POSITION_ROWS.find((p) => p.id === id)?.position_name ?? '';
}

export function defaultPositionIdByRole(role: StaffListItem['role']): number {
  return SEED_POSITION_ROWS.find((position) => position.role === role)?.id ?? 6;
}
