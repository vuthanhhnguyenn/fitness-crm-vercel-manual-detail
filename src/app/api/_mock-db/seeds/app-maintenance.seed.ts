import type { AppMaintenance } from '@/app/api/_schemas/app-maintenance.schema';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function offset(now: Date, ms: number): string {
  return new Date(now.getTime() + ms).toISOString();
}

/**
 * Seed dates are computed relative to `now()` at seed time rather than fixed
 * literals, so the set always contains a mix of completed/in_progress/planned
 * rows regardless of when the mock DB is seeded (see data-model.md's Seed data
 * section — reusing the UI prototype's literal 2026 dates verbatim would seed
 * every row as `completed` once real time passes them).
 */
export function buildAppMaintenanceSeed(): AppMaintenance[] {
  const now = new Date();

  return [
    {
      id: 'AM-001',
      target_brand: 'fit365',
      starts_at: offset(now, -90 * DAY_MS),
      ends_at: offset(now, -90 * DAY_MS + 4 * HOUR_MS),
      message: '定期メンテナンスを実施します。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -95 * DAY_MS),
      updated_at: null,
    },
    {
      id: 'AM-002',
      target_brand: 'joyfit',
      starts_at: offset(now, -60 * DAY_MS),
      ends_at: offset(now, -60 * DAY_MS + 2 * HOUR_MS),
      message: '緊急メンテナンスを実施します。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -61 * DAY_MS),
      updated_at: null,
    },
    {
      id: 'AM-003',
      target_brand: 'fit365',
      starts_at: offset(now, -30 * DAY_MS),
      ends_at: offset(now, -30 * DAY_MS + 4 * HOUR_MS),
      message: 'データベース移行のためメンテナンスを実施します。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -35 * DAY_MS),
      updated_at: null,
    },
    {
      id: 'AM-004',
      target_brand: 'joyfit',
      starts_at: offset(now, -7 * DAY_MS),
      ends_at: offset(now, -7 * DAY_MS + 4 * HOUR_MS),
      message: 'サーバー増強のためメンテナンスを実施します。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -10 * DAY_MS),
      updated_at: null,
    },
    {
      id: 'AM-005',
      target_brand: 'fit365',
      starts_at: offset(now, -1 * HOUR_MS),
      ends_at: offset(now, 3 * HOUR_MS),
      message: 'ただいまメンテナンス中です。ご不便をおかけしますがご了承ください。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -2 * DAY_MS),
      updated_at: null,
    },
    {
      id: 'AM-006',
      target_brand: 'joyfit',
      starts_at: offset(now, 14 * DAY_MS),
      ends_at: offset(now, 14 * DAY_MS + 4 * HOUR_MS),
      message: '定期メンテナンスを実施します。',
      created_by: 'STF-001',
      updated_by: null,
      created_at: offset(now, -1 * DAY_MS),
      updated_at: null,
    },
  ];
}
