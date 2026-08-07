import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetLessonSchedulesQuerySchema,
  type GetLessonSchedulesResponse,
  GetLessonSchedulesResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterSchedules, sortSchedules } from './_lib/lesson-schedule-response.util';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules',
  summary: 'Get lesson schedules',
  description: 'Get lesson schedule list with filtering and sorting (D-01)',
  tags: ['LessonSchedules'],
  query: GetLessonSchedulesQuerySchema,
  responses: [
    { status: 200, schema: GetLessonSchedulesResponseSchema, description: 'Lesson schedule list' },
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

    const parsed = GetLessonSchedulesQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query = parsed.data;
    const allSchedules = db.lessonSchedules.getList();
    const filtered = filterSchedules(allSchedules, query);
    const sorted = sortSchedules(filtered, query.sort_by, query.sort_order);

    const response: GetLessonSchedulesResponse = {
      schedules: sorted,
      total: sorted.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/lesson-schedules error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson schedules' }, { status: 500 });
  }
}
