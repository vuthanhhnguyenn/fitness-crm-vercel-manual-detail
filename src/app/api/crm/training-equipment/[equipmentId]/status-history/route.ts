import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  ListEquipmentStatusHistoryQuerySchema,
  ListEquipmentStatusHistoryResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { toHistoryItem } from '../../_lib/training-equipment.mapper';
import { assertStoreAccess } from '../../_lib/training-equipment.scope';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}/status-history',
  summary: 'List installation-status change history',
  description:
    'E-03 FR-011 設置状態変更履歴。時系列降順・ページ単位。Phase 1 は参照のみ（システム記録のため削除不可）',
  tags: ['Training Equipment Management'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  query: ListEquipmentStatusHistoryQuerySchema,
  responses: [
    {
      status: 200,
      schema: ListEquipmentStatusHistoryResponseSchema,
      description: 'History entries',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> },
) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { equipmentId } = await params;
  const equipment = db.trainingEquipment.getById(equipmentId);
  if (!equipment) {
    return NextResponse.json({ error: '対象の機材が見つかりません' }, { status: 404 });
  }

  const access = assertStoreAccess(authResult.user, equipment.storeId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const parsed = ListEquipmentStatusHistoryQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '検索条件に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const rows = db.trainingEquipment
    .getHistory(equipmentId)
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt));

  const totalItems = rows.length;
  const start = (query.page - 1) * query.limit;

  return NextResponse.json({
    items: rows.slice(start, start + query.limit).map(toHistoryItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
      // History has no filter conditions, so the cleared-condition count equals the total count.
      totalAllItems: query.includeTotalAll ? totalItems : null,
    },
  });
}
