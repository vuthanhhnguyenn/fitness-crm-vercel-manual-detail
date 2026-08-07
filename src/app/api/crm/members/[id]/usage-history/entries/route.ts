import { NextRequest, NextResponse } from 'next/server';

import { MOCK_VISIT_RECORDS } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetUsageHistoryEntriesResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/usage-history/entries',
  summary: 'Get member entry/exit history',
  description: 'Get paginated entry/exit history records with store and period filters',
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
      name: 'store',
      in: 'query',
      required: false,
      description: 'Filter by store ID or "all" for all stores',
      schema: { type: 'string' },
    },
    {
      name: 'period',
      in: 'query',
      required: false,
      description: 'Filter by period: this_month, last_month, 3months, or 6months',
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
      schema: GetUsageHistoryEntriesResponseSchema,
      description: 'Paginated entry/exit history records',
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

const EntriesQuerySchema = z.object({
  store: z.string().default('all'),
  period: z.enum(['this_month', 'last_month', '3months', '6months']).default('this_month'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function getDateRangeForPeriod(
  period: 'this_month' | 'last_month' | '3months' | '6months',
  now: Date = new Date(),
): { startDate: Date; endDate: Date } {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  switch (period) {
    case 'last_month': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    }
    case '3months': {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { startDate, endDate: thisMonthEnd };
    }
    case '6months': {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { startDate, endDate: thisMonthEnd };
    }
    case 'this_month':
    default:
      return { startDate: thisMonthStart, endDate: thisMonthEnd };
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params;

    const queryResult = EntriesQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { store, period, page, limit } = queryResult.data;
    const dateRange = getDateRangeForPeriod(period);

    const filtered = MOCK_VISIT_RECORDS.filter((record) => {
      const entryDate = new Date(record.entry_time);
      const matchesStore = store === 'all' || record.store_id === store;
      const matchesPeriod = entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
      return matchesStore && matchesPeriod;
    });

    const total = filtered.length;
    const startIdx = (page - 1) * limit;
    const items = filtered.slice(startIdx, startIdx + limit);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/usage-history/entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entry/exit history' }, { status: 500 });
  }
}
