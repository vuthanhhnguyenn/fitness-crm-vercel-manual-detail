import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { ExportTrainingEquipmentQuerySchema } from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import {
  INSTALLATION_STATUS_LABELS,
  LOCATION_IN_GYM_LABELS,
  filterAndSort,
} from '../_lib/training-equipment.mapper';
import { resolveStoreScope } from '../_lib/training-equipment.scope';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/export',
  summary: 'Export training equipment as CSV',
  description:
    'E-03 FR-010 機材台帳のCSVエクスポート。現在の一覧表示内容（検索・フィルタ適用後、ページングなし）を UTF-8 BOM 付き CSV で出力する',
  tags: ['Training Equipment Management'],
  query: ExportTrainingEquipmentQuerySchema,
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

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
  'エクササイズ紐づけ件数',
  '最終更新日',
];

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const parsed = ExportTrainingEquipmentQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const storeScope = resolveStoreScope(authResult.user, parsed.data.storeId);
    if (!storeScope.ok) {
      return NextResponse.json({ error: storeScope.error }, { status: storeScope.status });
    }

    const rows = filterAndSort(parsed.data, storeScope.scope).map((item) => [
      item.id,
      item.name,
      item.storeName,
      db.toolTypes.getById(item.mstToolId)?.name ?? '',
      item.quantity,
      item.locationInGym ? LOCATION_IN_GYM_LABELS[item.locationInGym] : '',
      item.manufacturer ?? '',
      item.model ?? '',
      item.installedOn ?? '',
      INSTALLATION_STATUS_LABELS[item.installationStatus],
      db.trainingEquipment.countLinks(item.id),
      formatDateYYYYMMDD_HHMM(item.updatedAt, ''),
    ]);

    // For a cross-store export (HQ exporting without storeId) the store part becomes `all`.
    const scopedStoreId = storeScope.scope?.[0];
    const storeSlug = scopedStoreId
      ? (db.stores.getList().find((store) => store.id === scopedStoreId)?.store_id ?? scopedStoreId)
      : 'all';

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `training_equipment_${storeSlug}_${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('Error exporting training equipment:', error);
    return NextResponse.json({ error: 'CSVの出力に失敗しました' }, { status: 500 });
  }
}
