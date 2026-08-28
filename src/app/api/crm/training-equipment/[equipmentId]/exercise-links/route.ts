import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  AddEquipmentExerciseLinksRequestSchema,
  AddEquipmentExerciseLinksResponseSchema,
  ListEquipmentExerciseLinksResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { assertHqOnly, assertStoreAccess } from '../../_lib/training-equipment.scope';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}/exercise-links',
  summary: 'List linked exercises',
  description: 'E-03 FR-008 機材に紐づいているエクササイズの一覧',
  tags: ['Training Equipment Management'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    {
      status: 200,
      schema: ListEquipmentExerciseLinksResponseSchema,
      description: 'Exercise links',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/training-equipment/{equipmentId}/exercise-links',
  summary: 'Add exercise links to equipment',
  description:
    'E-03 FR-008。器具種別が一致しないエクササイズを含む場合は 422 を返し、`force=true` で承認された場合のみ保存する',
  tags: ['Training Equipment Management'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: { schema: AddEquipmentExerciseLinksRequestSchema },
  responses: [
    { status: 201, schema: AddEquipmentExerciseLinksResponseSchema, description: 'Links added' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 422, schema: ErrorResponseSchema, description: 'Tool-type mismatch not confirmed' },
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

  return NextResponse.json({ items: db.trainingEquipment.getLinks(equipmentId) });
}

export async function POST(
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

  // Permission matrix: linking / unlinking exercises is HQ-only.
  const permission = assertHqOnly(authResult.user, 'エクササイズ紐づけの設定');
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }
  const access = assertStoreAccess(authResult.user, equipment.storeId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const parsed = AddEquipmentExerciseLinksRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '入力内容に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const { exerciseIds, force } = parsed.data;
  const mismatched = exerciseIds.filter((exerciseId) => {
    const candidate = db.trainingEquipment.getExerciseCandidate(exerciseId);
    return candidate !== undefined && candidate.mstToolId !== equipment.mstToolId;
  });

  if (mismatched.length > 0 && !force) {
    return NextResponse.json(
      { error: '器具種別が一致しないため確認が必要です', details: mismatched },
      { status: 422 },
    );
  }

  db.trainingEquipment.addLinks(equipmentId, exerciseIds);

  const warnings = mismatched.map(
    (exerciseId) =>
      `器具種別が一致しないエクササイズを承認のうえ紐づけました: ${
        db.trainingEquipment.getExerciseCandidate(exerciseId)?.name ?? exerciseId
      }`,
  );

  return NextResponse.json(
    {
      links: db.trainingEquipment.getLinks(equipmentId),
      ...(warnings.length > 0 && { warnings }),
    },
    { status: 201 },
  );
}
