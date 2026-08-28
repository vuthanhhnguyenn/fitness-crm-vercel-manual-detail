import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  TrainingEquipmentDetailSchema,
  UpdateTrainingEquipmentRequestSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { toDetail } from '../_lib/training-equipment.mapper';
import { assertCanWrite, assertHqOnly, assertStoreAccess } from '../_lib/training-equipment.scope';

const EQUIPMENT_ID_PARAM = {
  name: 'equipmentId',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' as const },
};

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Get training-equipment detail',
  description: 'E-03 FR-004 機材詳細（基本情報・設置情報・ステータスカード・紐づきエクササイズ）',
  tags: ['Training Equipment Management'],
  parameters: [EQUIPMENT_ID_PARAM],
  responses: [
    { status: 200, schema: TrainingEquipmentDetailSchema, description: 'Detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Update training-equipment attributes',
  description:
    'E-03 FR-005 機材編集。器具種別を変更した場合はエクササイズ紐づけをすべて解除する。設置店舗は変更不可（店舗間移動は撤去済み + 新規登録で対応）',
  tags: ['Training Equipment Management'],
  parameters: [EQUIPMENT_ID_PARAM],
  requestBody: { schema: UpdateTrainingEquipmentRequestSchema },
  responses: [
    { status: 200, schema: TrainingEquipmentDetailSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Logically delete training equipment',
  description: 'E-03 FR-006 論理削除。エクササイズ紐づけが存在する機材は削除不可（409 Conflict）',
  tags: ['Training Equipment Management'],
  parameters: [EQUIPMENT_ID_PARAM],
  responses: [
    { status: 204, description: 'Deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Linked exercises prevent delete' },
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
  return NextResponse.json(toDetail(equipment));
}

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
  const parsed = UpdateTrainingEquipmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '入力内容に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const patch = parsed.data;
  if (patch.mstToolId !== undefined) {
    const tool = db.toolTypes.getById(patch.mstToolId);
    if (!tool || tool.code === 'none') {
      return NextResponse.json({ error: '器具種別が正しくありません' }, { status: 400 });
    }
  }

  // FR-005: changing the tool type releases every exercise link.
  if (patch.mstToolId !== undefined && patch.mstToolId !== equipment.mstToolId) {
    db.trainingEquipment.deleteAllLinks(equipmentId);
  }

  // Only keys present in the request body are applied; nullable fields accept null.
  const next = db.trainingEquipment.update(equipmentId, {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.mstToolId !== undefined && { mstToolId: patch.mstToolId }),
    ...(patch.quantity !== undefined && { quantity: patch.quantity }),
    ...(patch.locationInGym !== undefined && { locationInGym: patch.locationInGym }),
    ...(patch.manufacturer !== undefined && { manufacturer: patch.manufacturer }),
    ...(patch.model !== undefined && { model: patch.model }),
    ...(patch.installedOn !== undefined && { installedOn: patch.installedOn }),
    ...(patch.note !== undefined && { note: patch.note }),
  });
  if (!next) {
    return NextResponse.json({ error: '対象の機材が見つかりません' }, { status: 404 });
  }
  return NextResponse.json(toDetail(next));
}

export async function DELETE(
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

  // Permission matrix: soft delete is HQ-only (Staff / Observer get 403).
  const permission = assertHqOnly(authResult.user, 'トレーニング機材の削除');
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }
  const access = assertStoreAccess(authResult.user, equipment.storeId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (db.trainingEquipment.hasLinks(equipmentId)) {
    return NextResponse.json(
      { error: 'エクササイズが紐づいているため削除できません' },
      { status: 409 },
    );
  }

  db.trainingEquipment.softDelete(equipmentId);
  return new NextResponse(null, { status: 204 });
}
