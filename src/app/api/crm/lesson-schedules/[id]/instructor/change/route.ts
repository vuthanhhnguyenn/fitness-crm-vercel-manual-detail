import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ChangeInstructorRequestSchema,
  type ChangeResponse,
  ChangeResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/lesson-schedules/{scheduleId}/instructor/change',
  summary: 'Change instructor',
  description: 'Change the instructor for a lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: ChangeInstructorRequestSchema, description: 'Instructor change data' },
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
    const parsed = ChangeInstructorRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const instructorId = parsed.data.instructor_ids[0];
    if (!instructorId) {
      return NextResponse.json({ error: 'インストラクターIDが必要です' }, { status: 400 });
    }

    const staff = db.staffs
      .getList()
      .find((s) => s.id === instructorId || s.staff_id === instructorId);

    db.lessonSchedules.update(scheduleId, {
      instructor_id: instructorId,
      instructor_name: staff?.name ?? existing.instructor_name,
    });

    const response: ChangeResponse = { message: 'インストラクターを変更しました' };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`PATCH /crm/lesson-schedules/${scheduleId}/instructor/change error:`, error);
    return NextResponse.json({ error: 'Failed to change instructor' }, { status: 500 });
  }
}
