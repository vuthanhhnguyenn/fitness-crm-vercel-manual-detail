import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type CreateLessonScheduleRequest,
  CreateLessonScheduleRequestSchema,
  CreateLessonScheduleResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/create',
  summary: 'Create lesson schedule',
  description: 'Create a new lesson schedule (single or recurring)',
  tags: ['LessonSchedules'],
  requestBody: { schema: CreateLessonScheduleRequestSchema, description: 'Schedule creation data' },
  responses: [
    { status: 201, schema: CreateLessonScheduleResponseSchema, description: 'Schedule created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body: CreateLessonScheduleRequest = await request.json();

    const parsed = CreateLessonScheduleRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lessonSchedules.create(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /crm/lesson-schedules/create error:', error);
    return NextResponse.json({ error: 'Failed to create lesson schedule' }, { status: 500 });
  }
}
