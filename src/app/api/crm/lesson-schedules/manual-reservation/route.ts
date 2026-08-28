import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateManualReservationRequestSchema,
  CreateManualReservationResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/manual-reservation',
  summary: 'Create manual reservation',
  description:
    'Manually register a reservation on behalf of a member, confirmed outside the app (D-01 FR-006, Mode B)',
  tags: ['LessonSchedules'],
  requestBody: {
    schema: CreateManualReservationRequestSchema,
    description: '手動予約登録リクエスト',
  },
  responses: [
    {
      status: 201,
      schema: CreateManualReservationResponseSchema,
      description: 'Reservation created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateManualReservationRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lessonSchedules.createManualReservation(parsed.data);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /crm/lesson-schedules/manual-reservation error:', error);
    return NextResponse.json({ error: 'Failed to create manual reservation' }, { status: 500 });
  }
}
