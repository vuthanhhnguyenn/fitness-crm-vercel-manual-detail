import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  UpdateTrainingEquipmentStatusResponseSchema,
  UpdateTrainingEquipmentStatusSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/training-equipment/{equipmentId}/status',
  summary: 'Update training equipment status',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: { schema: UpdateTrainingEquipmentStatusSchema },
  responses: [
    {
      status: 200,
      schema: UpdateTrainingEquipmentStatusResponseSchema,
      description: 'Status updated',
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
  const current = db.trainingEquipment.getById(equipmentId);
  if (!current) {
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = UpdateTrainingEquipmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }

  const nextStatus = parsed.data.next_status;

  const next = db.trainingEquipment.update(equipmentId, {
    status: nextStatus,
    last_updated_by: authResult.user.name,
  });
  if (!next) {
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }

  db.trainingEquipment.appendHistory({
    id: `TH-${Date.now()}`,
    equipment_id: equipmentId,
    changed_at: new Date().toISOString(),
    changed_by: authResult.user.name,
    from_status: current.status,
    to_status: nextStatus,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ equipment: next });
}
