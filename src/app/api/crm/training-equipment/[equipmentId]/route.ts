import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  PatchTrainingEquipmentSchema,
  TrainingEquipmentDetailResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Get training equipment detail',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    { status: 200, schema: TrainingEquipmentDetailResponseSchema, description: 'Detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Update training equipment',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: { schema: PatchTrainingEquipmentSchema },
  responses: [
    { status: 200, schema: TrainingEquipmentDetailResponseSchema, description: 'Updated' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/training-equipment/{equipmentId}',
  summary: 'Delete training equipment (soft delete)',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    { status: 204, description: 'Deleted' },
    { status: 400, schema: ErrorResponseSchema, description: 'Linked exercises prevent delete' },
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
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }
  return NextResponse.json({
    equipment: {
      ...equipment,
      tool_name: db.toolTypes.getByCode(equipment.tool_type)?.name ?? equipment.tool_type,
    },
  });
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
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = PatchTrainingEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }

  const patch = { ...parsed.data };
  delete patch.store_id;
  delete patch.store_name;
  const toolTypeChanged = patch.tool_type !== undefined && patch.tool_type !== equipment.tool_type;

  if (toolTypeChanged) {
    db.trainingEquipment.deleteAllLinks(equipmentId);
    db.trainingEquipment.refreshLinkCount(equipmentId);
  }

  const next = db.trainingEquipment.update(equipmentId, {
    ...patch,
    last_updated_by: authResult.user.name,
  });
  if (!next) {
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }
  return NextResponse.json({
    equipment: {
      ...next,
      tool_name: db.toolTypes.getByCode(next.tool_type)?.name ?? next.tool_type,
    },
  });
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
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }

  const hasLinks = db.trainingEquipment.hasLinks(equipmentId);
  if (hasLinks) {
    return NextResponse.json(
      { error: 'Cannot delete because linked exercises exist' },
      { status: 400 },
    );
  }

  db.trainingEquipment.softDelete(equipmentId);
  return new NextResponse(null, { status: 204 });
}
