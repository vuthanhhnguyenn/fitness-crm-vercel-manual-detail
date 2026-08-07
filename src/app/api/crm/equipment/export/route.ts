import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type ExportEquipmentRequest,
  ExportEquipmentRequestSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

registerRoute({
  method: 'post',
  path: '/crm/equipment/export',
  summary: 'Export equipment list as CSV',
  description:
    'Export the connected equipment list as a CSV file (UTF-8 with BOM) using the same filters and sort as the list screen without pagination',
  tags: ['Equipment'],
  requestBody: {
    schema: ExportEquipmentRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

type EquipmentRecord = ReturnType<typeof db.equipment.getAll>[number];

const EQUIPMENT_TYPE_LABELS: Record<EquipmentRecord['equipment_type'], string> = {
  entry_gate: '入退館ゲート',
  hydrogen_water_server: '水素水サーバー',
  body_composition_monitor: '体組成計',
  tanning_machine: 'タンニングマシン',
  protein_server: 'プロテインサーバー',
  other: 'その他',
};

const EQUIPMENT_STATUS_LABELS: Record<EquipmentRecord['status'], string> = {
  normal: '正常',
  error: '異常',
  maintenance: 'メンテナンス中',
  discarded: '廃棄',
};

const EQUIPMENT_SORTERS: Record<
  ExportEquipmentRequest['sort_by'],
  (left: EquipmentRecord, right: EquipmentRecord) => number
> = {
  id: (left, right) => left.id.localeCompare(right.id),
  name: (left, right) => left.name.localeCompare(right.name, 'ja'),
  controller_number: (left, right) => left.controller_number - right.controller_number,
  qr_code_id: (left, right) => (left.qr_code_id ?? '').localeCompare(right.qr_code_id ?? ''),
  equipment_type: (left, right) => left.equipment_type.localeCompare(right.equipment_type),
  status: (left, right) => left.status.localeCompare(right.status),
  updated_at: (left, right) => left.updated_at.localeCompare(right.updated_at),
};

const CSV_HEADERS = [
  '接続機器ID',
  '接続機器名',
  '店舗',
  '接点制御先番号',
  'QRコードID',
  '機器タイプ',
  'シリアル番号',
  '設置場所',
  'ステータス',
  '更新日時',
];

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = ExportEquipmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { equipment_type, search, sort_by, sort_order, status, store_id } = validationResult.data;

    let items = db.equipment.getAll();

    if (search) {
      const normalized = search.toLowerCase();
      items = items.filter((item) =>
        [item.name, item.serial_number, item.install_location].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
      );
    }

    if (store_id && store_id !== 'all') {
      items = items.filter((item) => item.store_id === store_id);
    }

    if (equipment_type) {
      items = items.filter((item) => item.equipment_type === equipment_type);
    }

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    items = [...items].sort((left, right) => {
      const comparison = EQUIPMENT_SORTERS[sort_by](left, right);
      return sort_order === 'desc' ? -comparison : comparison;
    });

    const rows = items.map((item) => [
      item.id,
      item.name,
      item.store_name,
      item.controller_number,
      item.qr_code_id ?? '',
      EQUIPMENT_TYPE_LABELS[item.equipment_type],
      item.serial_number,
      item.install_location,
      EQUIPMENT_STATUS_LABELS[item.status],
      formatDateYYYYMMDD_HHMM(item.updated_at, ''),
    ]);

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `equipment_${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('Error exporting equipment:', error);
    return NextResponse.json({ error: 'Failed to export equipment' }, { status: 500 });
  }
}
