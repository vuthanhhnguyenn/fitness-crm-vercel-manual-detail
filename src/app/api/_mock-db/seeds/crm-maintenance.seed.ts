import type { CrmMaintenanceAllowedUserRow } from '@/app/api/_mock-db/types/crm-maintenance.type';
import type { CrmMaintenance } from '@/app/api/_schemas/crm-maintenance.schema';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function offset(now: Date, ms: number): string {
  return new Date(now.getTime() + ms).toISOString();
}

export function buildCrmMaintenanceSeed(): {
  rows: CrmMaintenance[];
  allowedUsers: CrmMaintenanceAllowedUserRow[];
} {
  const now = new Date();
  const creator = 'STF-005';

  const rows: CrmMaintenance[] = [
    {
      id: 'M-001',
      title: '初期メンテナンス',
      starts_at: offset(now, -120 * DAY_MS),
      ends_at: offset(now, -120 * DAY_MS + 4 * HOUR_MS),
      message: 'CRMシステムの初期メンテナンスを実施します。',
      note: '初回セットアップ作業',
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -125 * DAY_MS),
      updated_at: null,
      notified: true,
    },
    {
      id: 'M-002',
      title: 'サーバー増強作業',
      starts_at: offset(now, -90 * DAY_MS),
      ends_at: offset(now, -90 * DAY_MS + 2 * HOUR_MS),
      message: 'サーバー増強のためCRM管理画面へのアクセスを制限します。',
      note: null,
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -95 * DAY_MS),
      updated_at: null,
      notified: true,
    },
    {
      id: 'M-003',
      title: 'DB移行作業',
      starts_at: offset(now, -60 * DAY_MS),
      ends_at: offset(now, -60 * DAY_MS + 5 * HOUR_MS),
      message: 'データベース移行のため一時的にアクセスを制限します。',
      note: 'ステージング検証済み',
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -65 * DAY_MS),
      updated_at: null,
      notified: true,
    },
    {
      id: 'M-004',
      title: '緊急セキュリティパッチ',
      starts_at: offset(now, -30 * DAY_MS),
      ends_at: offset(now, -30 * DAY_MS + 2 * HOUR_MS),
      message: '緊急セキュリティパッチ適用のためメンテナンスを実施します。',
      note: null,
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -32 * DAY_MS),
      updated_at: null,
      notified: true,
    },
    {
      id: 'M-005',
      title: '検索インデックス再構築',
      starts_at: offset(now, -2 * HOUR_MS),
      ends_at: offset(now, 4 * HOUR_MS),
      message: '検索インデックスの再構築のため、一時的にアクセスを制限します。',
      note: '夜間バッチと重複しないよう時間帯を調整済み',
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -7 * DAY_MS),
      updated_at: null,
      notified: true,
    },
    {
      id: 'M-006',
      title: '2026年7月定期メンテナンス',
      starts_at: offset(now, 14 * DAY_MS),
      ends_at: offset(now, 14 * DAY_MS + 3 * HOUR_MS),
      message: '定期メンテナンスのため、一時的にアクセスを制限します。',
      note: 'DBバージョンアップ',
      created_by: creator,
      updated_by: null,
      created_at: offset(now, -1 * DAY_MS),
      updated_at: null,
      // planned・未通知: 通知送信フローを確認するための行
      notified: false,
    },
  ];

  const allowedUsersByMaintenance: Record<string, string[]> = {
    'M-001': ['STF-001', 'STF-002', 'STF-003'],
    'M-002': ['STF-001', 'STF-002', 'STF-003', 'STF-004'],
    'M-003': ['STF-001', 'STF-002', 'STF-003', 'STF-004', 'STF-005'],
    'M-004': ['STF-001', 'STF-002'],
    'M-005': ['STF-001', 'STF-005'],
    'M-006': ['STF-001', 'STF-002', 'STF-003'],
  };

  const allowedUsers: CrmMaintenanceAllowedUserRow[] = Object.entries(
    allowedUsersByMaintenance,
  ).flatMap(([maintenanceId, staffIds]) =>
    staffIds.map((staffId) => ({ crm_maintenance_id: maintenanceId, staff_id: staffId })),
  );

  return { rows, allowedUsers };
}
