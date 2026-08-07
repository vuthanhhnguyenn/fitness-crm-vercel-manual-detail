import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetLessonScheduleKpiSummaryResponse,
  GetLessonScheduleKpiSummaryResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

const QuerySchema = z.object({
  date: z.string().optional(),
});

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/summary',
  summary: 'Get lesson schedule KPI summary',
  description: 'Get KPI summary for lesson schedules on a given date (D-01)',
  tags: ['LessonSchedules'],
  query: QuerySchema,
  responses: [
    {
      status: 200,
      schema: GetLessonScheduleKpiSummaryResponseSchema,
      description: 'KPI summary',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    const kpi = db.lessonSchedules.getKpiSummary(date);
    const response: GetLessonScheduleKpiSummaryResponse = { kpi };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/lesson-schedules/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI summary' }, { status: 500 });
  }
}
