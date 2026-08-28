import { NextRequest, NextResponse } from 'next/server';

import { getLessonReservationsForMember } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetUsageHistoryLessonsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/usage-history/lessons',
  summary: 'Get member lesson reservation history',
  description: 'Get paginated lesson reservation history records',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
    {
      name: 'from',
      in: 'query',
      required: false,
      description: 'Start date (inclusive, YYYY-MM-DD)',
      schema: { type: 'string' },
    },
    {
      name: 'to',
      in: 'query',
      required: false,
      description: 'End date (inclusive, YYYY-MM-DD)',
      schema: { type: 'string' },
    },
    {
      name: 'page',
      in: 'query',
      required: false,
      description: 'Page number (1-based)',
      schema: { type: 'integer' },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Number of records per page',
      schema: { type: 'integer' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetUsageHistoryLessonsResponseSchema,
      description: 'Paginated lesson reservations',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid query parameters',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const LessonsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const queryResult = LessonsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { from, to, page, limit } = queryResult.data;
    // `to` is inclusive of the whole day
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    const filtered = getLessonReservationsForMember(id).filter((record) => {
      const lessonTime = new Date(`${record.lessonDate}T00:00:00`).getTime();
      const afterFrom = fromTime === null || lessonTime >= fromTime;
      const beforeTo = toTime === null || lessonTime <= toTime;
      return afterFrom && beforeTo;
    });

    const total = filtered.length;
    const startIdx = (page - 1) * limit;
    const items = filtered.slice(startIdx, startIdx + limit);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/usage-history/lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson history' }, { status: 500 });
  }
}
