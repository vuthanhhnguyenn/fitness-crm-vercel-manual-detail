import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  BulkUpdateInstallationStatusRequestSchema,
  BulkUpdateInstallationStatusResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { assertCanWrite, assertStoreAccess } from '../_lib/training-equipment.scope';

registerRoute({
  method: 'post',
  path: '/crm/training-equipment/bulk-status-update',
  summary: 'Bulk update installation status',
  description:
    'E-03 FR-009 設置状態の一括更新。変更理由は選択された全機材に共通で適用され、FR-011 変更履歴に記録される',
  tags: ['Training Equipment Management'],
  requestBody: { schema: BulkUpdateInstallationStatusRequestSchema },
  responses: [
    {
      status: 200,
      schema: BulkUpdateInstallationStatusResponseSchema,
      description: 'Bulk status update result',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const parsed = BulkUpdateInstallationStatusRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const permission = assertCanWrite(authResult.user);
    if (!permission.ok) {
      return NextResponse.json({ error: permission.error }, { status: permission.status });
    }

    const { equipmentIds, newStatus, changedReason } = parsed.data;

    // If even one record lies outside the caller's store, reject with 403 instead of applying partially.
    for (const id of equipmentIds) {
      const equipment = db.trainingEquipment.getById(id);
      if (!equipment) continue;
      const access = assertStoreAccess(authResult.user, equipment.storeId);
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }
    }

    const result = db.trainingEquipment.bulkChangeStatus(
      equipmentIds,
      newStatus,
      authResult.user.name,
      changedReason,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk updating installation status:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
