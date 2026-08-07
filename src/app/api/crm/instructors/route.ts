import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetInstructorsQuerySchema,
  GetInstructorsResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/instructors',
  summary: 'List instructors',
  description: 'Get instructor list, optionally filtered by store or role',
  tags: ['LessonSchedules'],
  query: GetInstructorsQuerySchema,
  responses: [
    { status: 200, schema: GetInstructorsResponseSchema, description: 'Instructor list' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id') ?? undefined;
    const role = request.nextUrl.searchParams.get('role') ?? undefined;

    const instructors = db.instructors.getList(storeId, role);
    return NextResponse.json({ instructors });
  } catch (error) {
    console.error('GET /crm/instructors error:', error);
    return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
  }
}
