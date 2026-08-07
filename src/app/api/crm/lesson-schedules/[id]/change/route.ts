import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ScheduleChangeDraftSchema,
  ScheduleChangeResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { applyTimeSlotToSchedule } from '../../_lib/lesson-schedule-time.util';

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/{id}/change',
  summary: 'Change lesson schedule',
  description: 'Apply a schedule change request. Phase 1: non-validating flow (D-01)',
  tags: ['LessonSchedules'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'スケジュールID',
    },
  ],
  requestBody: {
    schema: ScheduleChangeDraftSchema,
    description: 'スケジュール変更リクエスト',
  },
  responses: [
    { status: 200, schema: ScheduleChangeResponseSchema, description: 'Changed successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const existing = db.lessonSchedules.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ScheduleChangeDraftSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    // Phase 1: apply change without validation
    const patch: Partial<typeof existing> = {};
    if (parsed.data.new_start_time) {
      patch.start_time = applyTimeSlotToSchedule(existing.start_time, parsed.data.new_start_time);
    }
    if (parsed.data.new_end_time) {
      patch.end_time = applyTimeSlotToSchedule(existing.start_time, parsed.data.new_end_time);
    }
    if (parsed.data.new_instructor_id) {
      patch.instructor_id = parsed.data.new_instructor_id;
    }

    db.lessonSchedules.update(id, patch);

    return NextResponse.json({ message: 'スケジュールを変更しました', id });
  } catch (error) {
    console.error(`POST /crm/lesson-schedules/${id}/change error:`, error);
    return NextResponse.json({ error: 'Failed to change lesson schedule' }, { status: 500 });
  }
}
