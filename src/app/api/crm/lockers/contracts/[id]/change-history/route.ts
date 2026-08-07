import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetLockerContractChangeHistoryResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/contracts/{id}/change-history',
  summary: 'Get locker contract change history',
  description: 'Get change history for a specific locker contract',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Locker contract internal id',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetLockerContractChangeHistoryResponseSchema,
      description: 'Change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(_request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const contract = db.lockerContracts.getById(id);
    if (!contract) {
      return NextResponse.json({ error: 'ロッカー契約が見つかりません' }, { status: 404 });
    }

    const history = db.lockerContracts.getChangeHistory(id);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/lockers/contracts/[id]/change-history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locker contract change history' },
      { status: 500 },
    );
  }
}
