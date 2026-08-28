import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { assertHqOnly, assertStoreAccess } from '../../../_lib/training-equipment.scope';

registerRoute({
  method: 'delete',
  path: '/crm/training-equipment/{equipmentId}/exercise-links/{exerciseId}',
  summary: 'Remove a single exercise link',
  description: 'E-03 FR-008 紐づけ解除。エクササイズ自体は削除されない',
  tags: ['Training Equipment Management'],
  parameters: [
    { name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'exerciseId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: [
    { status: 204, description: 'Deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string; exerciseId: string }> },
) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { equipmentId, exerciseId } = await params;
  const equipment = db.trainingEquipment.getById(equipmentId);
  if (!equipment) {
    return NextResponse.json({ error: '対象の機材が見つかりません' }, { status: 404 });
  }

  // Permission matrix: unlinking is HQ-only as well.
  const permission = assertHqOnly(authResult.user, 'エクササイズ紐づけの解除');
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }
  const access = assertStoreAccess(authResult.user, equipment.storeId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!db.trainingEquipment.deleteLink(equipmentId, exerciseId)) {
    return NextResponse.json({ error: '対象の紐づけが見つかりません' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
