import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { GetTrainingEquipmentHistoryResponseSchema } from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}/history',
  summary: 'Get training equipment status history',
  description: 'Read-only seeded history in Phase 1',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    {
      status: 200,
      schema: GetTrainingEquipmentHistoryResponseSchema,
      description: 'History entries',
    },
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

  const items = db.trainingEquipment
    .getHistory(equipmentId)
    .sort((left, right) => right.changed_at.localeCompare(left.changed_at));
  return NextResponse.json({ items });
}
