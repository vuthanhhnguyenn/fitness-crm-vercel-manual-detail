import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  StudioSpaceGridResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/{scheduleId}/spaces',
  summary: 'Get studio space grid',
  description: 'Return studio space grid for the schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  responses: [
    { status: 200, schema: StudioSpaceGridResponseSchema, description: 'Studio space grid' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const spaces = db.reservations.getSpaces(scheduleId);
    return NextResponse.json(spaces);
  } catch (error) {
    console.error(`GET /crm/lesson-schedules/${scheduleId}/spaces error:`, error);
    return NextResponse.json({ error: 'Failed to fetch studio spaces' }, { status: 500 });
  }
}
