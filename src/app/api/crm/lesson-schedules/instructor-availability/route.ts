import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  InstructorAvailabilityQuerySchema,
  InstructorAvailabilityResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/instructor-availability',
  summary: 'Check instructor availability',
  description: 'Check if an instructor is available for a given date and time',
  tags: ['LessonSchedules'],
  query: InstructorAvailabilityQuerySchema,
  responses: [
    {
      status: 200,
      schema: InstructorAvailabilityResponseSchema,
      description: 'Availability result',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const parsed = InstructorAvailabilityQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query = parsed.data;
    const result = db.lessonSchedules.checkInstructorAvailability(
      query.instructor_id,
      query.date,
      query.start_time,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /crm/lesson-schedules/instructor-availability error:', error);
    return NextResponse.json({ error: 'Failed to check instructor availability' }, { status: 500 });
  }
}
