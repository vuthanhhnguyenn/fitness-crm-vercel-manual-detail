import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetLockerSummaryResponse,
  GetLockerSummaryResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/summary',
  summary: 'Get locker summary',
  description: 'Aggregate summary counts for the locker list tabs',
  tags: ['Lockers'],
  responses: [
    {
      status: 200,
      schema: GetLockerSummaryResponseSchema,
      description: 'Locker summary counts',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const summary: GetLockerSummaryResponse = {
      lockers_count: db.lockers.getList().length,
      contracts_count: db.lockerContracts.getList().length,
      pending_slots_count: db.lockerPendingSlots.getList().length,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching locker summary:', error);
    return NextResponse.json({ error: 'Failed to fetch locker summary' }, { status: 500 });
  }
}
