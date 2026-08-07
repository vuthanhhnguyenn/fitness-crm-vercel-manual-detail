import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetStoreSummaryQuerySchema,
  type GetStoreSummaryResponse,
  GetStoreSummaryResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { sortStoreSummaries } from '../../_lib/lesson-schedule-response.util';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/stores/summary',
  summary: 'Get all-store schedule summary',
  description: 'Get area-level KPI and per-store schedule summary (D-01)',
  tags: ['LessonSchedules'],
  query: GetStoreSummaryQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetStoreSummaryResponseSchema,
      description: 'Store summary',
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

    const parsed = GetStoreSummaryQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query = parsed.data;
    const date = query.date ?? new Date().toISOString().slice(0, 10);
    const { areas, stores } = db.lessonSchedules.getStoreSummary(date);

    const sortedStores = sortStoreSummaries(stores, query);

    const response: GetStoreSummaryResponse = {
      areas,
      stores: sortedStores,
      total: sortedStores.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/lesson-schedules/stores/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch store summary' }, { status: 500 });
  }
}
