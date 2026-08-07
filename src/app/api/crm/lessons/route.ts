import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetLessonsQuerySchema,
  GetLessonsResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lessons',
  summary: 'List lessons',
  description: 'Get lesson master list, optionally filtered by lesson type',
  tags: ['LessonSchedules'],
  query: GetLessonsQuerySchema,
  responses: [
    { status: 200, schema: GetLessonsResponseSchema, description: 'Lesson list' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const lessonType = request.nextUrl.searchParams.get('lesson_type') as
      | 'studio'
      | 'personal'
      | null;

    const lessons = db.lessons.getList(lessonType ?? undefined);
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('GET /crm/lessons error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}
