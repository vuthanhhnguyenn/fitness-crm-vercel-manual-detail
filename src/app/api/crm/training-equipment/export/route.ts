import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type ExportTrainingEquipmentRequest,
  ExportTrainingEquipmentRequestSchema,
  type LocationInGym,
  type TrainingEquipmentItem,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

registerRoute({
  method: 'post',
  path: '/crm/training-equipment/export',
  summary: 'Export training equipment list as CSV',
  description:
    'Export the training equipment list as a CSV file (UTF-8 with BOM) using the same filters and sort as the list screen without pagination',
  tags: ['Training Equipment'],
  requestBody: {
    schema: ExportTrainingEquipmentRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

const STATUS_LABELS: Record<TrainingEquipmentItem['status'], string> = {
  installed: '設置中',
  maintenance: 'メンテナンス中',
  removed: '撤去済み',
  discarded: '廃棄',
};

const TOOL_TYPE_LABELS: Record<TrainingEquipmentItem['tool_type'], string> = {
  machine: 'マシン',
  cableMachine: 'ケーブルマシン',
  smithMachine: 'スミスマシン',
  barbell: 'バーベル',
  dumbbell: 'ダンベル',
  kettlebell: 'ケトルベル',
  resistanceBand: 'レジスタンスバンド',
  trx: 'TRX',
  other: 'その他',
};

const LOCATION_IN_GYM_LABELS: Record<LocationInGym, string> = {
  aerobic_area: '有酸素エリア',
  machine_area: 'マシンエリア',
  free_weight_area: 'フリーウェイトエリア',
  stretch_area: 'ストレッチエリア',
};

const CSV_HEADERS = [
  '機材ID',
  '機材名',
  '店舗',
  '器具種別',
  '数量',
  '設置場所',
  'メーカー',
  '型番',
  '設置日',
  '設置状態',
  '紐づけ件数',
  '最終更新日',
  '最終更新者',
];

function filterAndSortTrainingEquipment(query: ExportTrainingEquipmentRequest) {
  let items = db.trainingEquipment.getAll().filter((item) => !item.is_deleted);

  if (query.store_id && query.store_id !== 'all') {
    items = items.filter((item) => item.store_id === query.store_id);
  }
  if (query.keyword) {
    const needle = query.keyword.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        (item.installation_area ?? '').toLowerCase().includes(needle) ||
        (item.installation_area
          ? LOCATION_IN_GYM_LABELS[item.installation_area].toLowerCase().includes(needle)
          : false),
    );
  }
  if (query.tool_type) {
    items = items.filter((item) => item.tool_type === query.tool_type);
  }
  if (query.status === 'exclude_discarded') {
    items = items.filter((item) => item.status !== 'discarded');
  } else if (query.status !== 'all') {
    items = items.filter((item) => item.status === query.status);
  }

  const sortBy = query.sort_by ?? 'tool_type';
  const sortOrder = query.sort_order ?? 'asc';
  items = [...items].sort((left, right) => {
    const l = String(left[sortBy as keyof TrainingEquipmentItem] ?? '');
    const r = String(right[sortBy as keyof TrainingEquipmentItem] ?? '');
    const cmp = l.localeCompare(r, 'ja');
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  return items;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = ExportTrainingEquipmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const items = filterAndSortTrainingEquipment(validationResult.data);

    const rows = items.map((item) => [
      item.id,
      item.name,
      item.store_name,
      TOOL_TYPE_LABELS[item.tool_type],
      item.quantity,
      item.installation_area ? LOCATION_IN_GYM_LABELS[item.installation_area] : '',
      item.manufacturer ?? '',
      item.model_number ?? '',
      item.installed_on ?? '',
      STATUS_LABELS[item.status],
      item.linked_exercise_count,
      formatDateYYYYMMDD_HHMM(item.last_updated_at, ''),
      item.last_updated_by,
    ]);

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `training_equipment_${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('Error exporting training equipment:', error);
    return NextResponse.json({ error: 'Failed to export training equipment' }, { status: 500 });
  }
}
