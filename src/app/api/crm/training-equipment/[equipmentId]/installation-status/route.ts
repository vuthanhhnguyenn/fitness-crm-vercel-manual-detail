import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  ChangeInstallationStatusRequestSchema,
  ChangeInstallationStatusResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { toDetail } from '../../_lib/training-equipment.mapper';
import { assertCanWrite, assertStoreAccess } from '../../_lib/training-equipment.scope';

registerRoute({
  method: 'patch',
  path: '/crm/training-equipment/{equipmentId}/installation-status',
  summary: 'Change installation status',
  description:
    'E-03 FR-007 設置状態変更。変更理由（changedReason）は必須で、FR-011 変更履歴に記録される',
  tags: ['Training Equipment Management'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: { schema: ChangeInstallationStatusRequestSchema },
  responses: [
    {
      status: 200,
      schema: ChangeInstallationStatusResponseSchema,
      description: 'Installation status updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function PATCH(
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

  const permission = assertCanWrite(authResult.user);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }
  const access = assertStoreAccess(authResult.user, equipment.storeId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const parsed = ChangeInstallationStatusRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '入力内容に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const next = db.trainingEquipment.changeStatus(
    equipmentId,
    parsed.data.newStatus,
    authResult.user.name,
    parsed.data.changedReason,
  );
  if (!next) {
    return NextResponse.json({ error: '対象の機材が見つかりません' }, { status: 404 });
  }

  return NextResponse.json({ original: toDetail(next) });
}
