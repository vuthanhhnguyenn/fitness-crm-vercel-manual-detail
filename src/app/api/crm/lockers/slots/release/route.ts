import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  BulkReleaseLockerSlotsRequestSchema,
  type BulkReleaseLockerSlotsResponse,
  BulkReleaseLockerSlotsResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lockers/slots/release',
  summary: 'Bulk release pending locker slots',
  description:
    'Mark pending-release locker slots as available after cleaning and clear linked member data across one or more lockers',
  tags: ['Lockers'],
  requestBody: {
    schema: BulkReleaseLockerSlotsRequestSchema,
    description: 'Release targets grouped by locker',
  },
  responses: [
    {
      status: 200,
      schema: BulkReleaseLockerSlotsResponseSchema,
      description: 'Slots released successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'No pending-release slots found' },
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
    const parsedBody = BulkReleaseLockerSlotsRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      const errors = parsedBody.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lockers.releaseSlotsBulk(parsedBody.data.items);
    if (!result) {
      return NextResponse.json(
        { error: 'No pending-release slots found for the provided slot numbers' },
        { status: 404 },
      );
    }

    const response: BulkReleaseLockerSlotsResponse = {
      message: `${result.released_slot_numbers.length}件のスロットを開放しました`,
      released_slot_numbers: result.released_slot_numbers,
      locker_ids: result.locker_ids,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error bulk releasing locker slots:', error);
    return NextResponse.json({ error: 'Failed to release locker slots' }, { status: 500 });
  }
}
