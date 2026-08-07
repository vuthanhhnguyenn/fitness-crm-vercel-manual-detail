import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type ExportLockerPendingSlotsRequest,
  ExportLockerPendingSlotsRequestSchema,
  type ExportLockerPendingSlotsResponse,
  ExportLockerPendingSlotsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockerPendingSlots } from '../../_utils/locker-query.util';

registerRoute({
  method: 'post',
  path: '/crm/lockers/pending-slots/export',
  summary: 'Export pending locker slot list',
  description:
    'Export pending locker slot list data using the same filters and sort as the list screen without pagination',
  tags: ['Lockers'],
  requestBody: {
    schema: ExportLockerPendingSlotsRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    {
      status: 200,
      schema: ExportLockerPendingSlotsResponseSchema,
      description: 'Pending locker slot list export data',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = ExportLockerPendingSlotsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const exportRequest: ExportLockerPendingSlotsRequest = validationResult.data;
    const filtered = filterLockerPendingSlots(db.lockerPendingSlots.getList(), exportRequest);

    const response: ExportLockerPendingSlotsResponse = { pending_slots: filtered };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting pending locker slots:', error);
    return NextResponse.json({ error: 'Failed to export pending locker slots' }, { status: 500 });
  }
}
