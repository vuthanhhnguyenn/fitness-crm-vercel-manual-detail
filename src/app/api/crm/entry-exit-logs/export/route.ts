import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { ExportEntryExitHistoryQuerySchema } from '@/app/api/_schemas/entry-exit-log.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatTime } from '@/utils/date.util';
import { formatDurationMinutes } from '@/utils/format.util';

registerRoute({
  method: 'post',
  path: '/crm/entry-exit-logs/export',
  summary: 'Export entry-exit visit history as CSV (B-01-01)',
  description:
    'Export the currently filtered visit history as a CSV file (UTF-8 with BOM) using the same filters and sort as the history screen, without pagination',
  tags: ['Entry-Exit'],
  requestBody: {
    schema: ExportEntryExitHistoryQuerySchema,
    description: 'Export filters and sort (page/limit omitted — always exports the full set)',
  },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

const AUTH_METHOD_LABELS: Record<'qr' | 'nfc', string> = {
  qr: 'QRコード',
  nfc: 'NFCカード',
};

const RESULT_LABELS: Record<'success' | 'denied', string> = {
  success: '成功',
  denied: '拒否',
};

const VISIT_STATUS_LABELS: Record<'completed' | 'in_progress' | 'denied', string> = {
  completed: '退館済み',
  in_progress: '在館中',
  denied: '拒否',
};

const CSV_HEADERS = [
  '会員ID',
  '氏名',
  'ふりがな',
  '性別',
  '来館日',
  '入館時刻',
  '退館時刻',
  '在館時間',
  '状態',
  '契約名',
  '所属店舗',
  '入館店舗',
  '認証方式',
  '処理結果',
];

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const body = await request.json();
    const validationResult = ExportEntryExitHistoryQuerySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query = validationResult.data;
    const requested = query.store_id && query.store_id !== 'all' ? [query.store_id] : null;
    const storeIds =
      allowedStoreIds === null
        ? requested
        : requested === null
          ? allowedStoreIds
          : requested.filter((id) => allowedStoreIds.includes(id));

    const { rows } = db.entryExitLogs.listHistory({
      search: query.search,
      dateFrom: query.date_from,
      dateTo: query.date_to,
      storeIds,
      authMethod: query.auth_method,
      result: query.result,
      sortBy: query.sort_by,
      sortOrder: query.sort_order,
    });

    const csvRows = rows.map((row) => [
      row.member_id,
      row.name,
      row.furigana,
      row.gender === 'male' ? '男性' : row.gender === 'female' ? '女性' : 'その他',
      row.visit_date,
      formatTime(row.entry_time, ''),
      row.visit_status === 'completed' ? formatTime(row.exit_time, '') : '',
      row.visit_status === 'completed' ? formatDurationMinutes(row.stay_duration_minutes) : '',
      VISIT_STATUS_LABELS[row.visit_status],
      row.contract_name,
      row.home_store_name,
      row.visit_store_name,
      AUTH_METHOD_LABELS[row.auth_method],
      RESULT_LABELS[row.result],
    ]);

    const csv = buildCsv(CSV_HEADERS, csvRows);
    return csvFileResponse(csv, `entry_exit_history_${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('Error exporting entry-exit history:', error);
    return NextResponse.json({ error: 'Failed to export entry-exit history' }, { status: 500 });
  }
}
