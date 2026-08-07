import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEquipmentHistoryResponse,
  GetEquipmentHistoryResponseSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/equipment/{id}/history',
  summary: 'Get equipment status change history',
  description: 'Get read-only seed status change history for a connected equipment record',
  tags: ['Equipment'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Connected equipment ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetEquipmentHistoryResponseSchema,
      description: 'Equipment status change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Equipment not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    if (!db.equipment.getById(id)) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const response: GetEquipmentHistoryResponse = {
      history: db.equipment.getHistory(id),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching equipment history:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment history' }, { status: 500 });
  }
}
