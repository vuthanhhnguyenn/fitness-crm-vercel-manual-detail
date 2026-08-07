import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type ExportControllersRequest,
  ExportControllersRequestSchema,
} from '@/app/api/_schemas/controller.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/controllers/export',
  summary: 'Export contact-control device list as CSV',
  description:
    'Export the contact-control device list (接点制御装置) as a CSV file (UTF-8 with BOM) using the same filters and sort as the list screen without pagination',
  tags: ['Controllers'],
  requestBody: {
    schema: ExportControllersRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

type ControllerRecord = ReturnType<typeof db.controllers.list>['items'][number];

const STATUS_LABELS: Record<ControllerRecord['status'], string> = {
  normal: '正常',
  error: '異常',
  maintenance: 'メンテナンス中',
  discarded: '廃棄',
};

const CSV_HEADERS = [
  '装置ID',
  '装置名',
  '店舗コード',
  '設置場所',
  'IPアドレス',
  'ポート番号',
  'ファームウェア',
  '制御ポート数',
  '紐付き機器数',
  'ステータス',
];

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = ExportControllersRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const filters: ExportControllersRequest = validationResult.data;
    // Reuse the list logic (filter + sort + device counts) without pagination.
    const { items } = db.controllers.list({
      ...filters,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const rows = items.map((item) => [
      item.controller_id,
      item.name ?? '',
      item.store_code,
      item.location,
      item.ip_address,
      item.port,
      item.firmware_version ?? '',
      item.control_port_count,
      item.device_count,
      STATUS_LABELS[item.status],
    ]);

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `controllers_${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('Error exporting controllers:', error);
    return NextResponse.json({ error: 'Failed to export controllers' }, { status: 500 });
  }
}
