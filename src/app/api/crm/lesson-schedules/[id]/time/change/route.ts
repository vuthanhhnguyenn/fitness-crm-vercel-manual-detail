import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type ChangeResponse,
  ChangeResponseSchema,
  ChangeTimeRequestSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { applyTimeSlotToSchedule } from '../../../_lib/lesson-schedule-time.util';

registerRoute({
  method: 'patch',
  path: '/crm/lesson-schedules/{scheduleId}/time/change',
  summary: 'Change time',
  description: 'Change the start/end time of a lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: ChangeTimeRequestSchema, description: 'Time change data' },
  responses: [
    { status: 200, schema: ChangeResponseSchema, description: 'Changed successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ChangeTimeRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    db.lessonSchedules.update(scheduleId, {
      start_time: applyTimeSlotToSchedule(existing.start_time, parsed.data.start_time),
      end_time: applyTimeSlotToSchedule(existing.start_time, parsed.data.end_time),
    });

    const response: ChangeResponse = { message: 'レッスン時間を変更しました' };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`PATCH /crm/lesson-schedules/${scheduleId}/time/change error:`, error);
    return NextResponse.json({ error: 'Failed to change time' }, { status: 500 });
  }
}
