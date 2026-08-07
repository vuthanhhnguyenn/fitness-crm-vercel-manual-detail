import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CancelLessonRequestSchema,
  type CancelLessonResponse,
  CancelLessonResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/{scheduleId}/cancel',
  summary: 'Cancel lesson',
  description: 'Cancel an entire lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: CancelLessonRequestSchema, description: 'Cancel lesson data' },
  responses: [
    { status: 200, schema: CancelLessonResponseSchema, description: 'Cancelled successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CancelLessonRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    db.lessonSchedules.update(scheduleId, { status: 'cancelled' });

    const response: CancelLessonResponse = {
      id: scheduleId,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'staff',
      cancel_reason: parsed.data.cancel_reason,
      message: 'レッスンを中止しました',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`POST /crm/lesson-schedules/${scheduleId}/cancel error:`, error);
    return NextResponse.json({ error: 'Failed to cancel lesson' }, { status: 500 });
  }
}
