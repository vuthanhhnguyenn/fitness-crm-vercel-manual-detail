import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetOptionUsageResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { format } from 'date-fns';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/contracts/option-usage',
  summary: 'Get member option-usage history',
  description: 'Get paginated option-usage history (オプション利用履歴) for a member',
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
      description: 'Page number (1-based); defaults to 1',
      schema: { type: 'integer' },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Page size; defaults to 20',
      schema: { type: 'integer' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetOptionUsageResponseSchema,
      description: 'Paginated option-usage history',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const pageParam = Number(request.nextUrl.searchParams.get('page'));
    const limitParam = Number(request.nextUrl.searchParams.get('limit'));
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 20;

    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    // `to` is inclusive of the whole day
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    // Generated relative to "now" so the default month (current month) always has
    // data, and the previous month is populated too (for MonthPicker navigation).
    const now = new Date();
    const optionSamples = [
      { storeName: 'JOYFIT渋谷店', optionName: 'パーソナルトレーニング', count: 1 },
      { storeName: 'JOYFIT渋谷店', optionName: 'レンタルタオル', count: 2 },
      { storeName: 'JOYFIT新宿店', optionName: 'パーソナルトレーニング', count: 1 },
      { storeName: 'JOYFIT渋谷店', optionName: 'プロテインバー', count: 3 },
      { storeName: 'JOYFIT池袋店', optionName: 'レンタルシューズ', count: 1 },
      { storeName: 'JOYFIT新宿店', optionName: 'パーソナルトレーニング', count: 2 },
    ];
    // ~6 usages spread over the last ~45 days
    const allItems = optionSamples.map((sample, index) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index * 8);
      return {
        id: `${id}-ou-${String(index + 1).padStart(3, '0')}`,
        date: format(day, 'yyyy-MM-dd'),
        storeName: sample.storeName,
        optionName: sample.optionName,
        count: sample.count,
      };
    });

    const filtered = allItems.filter((item) => {
      const itemTime = new Date(`${item.date}T00:00:00`).getTime();
      const afterFrom = fromTime === null || itemTime >= fromTime;
      const beforeTo = toTime === null || itemTime <= toTime;
      return afterFrom && beforeTo;
    });

    const start = (page - 1) * limit;
    const paginatedItems = filtered.slice(start, start + limit);

    const mockData = GetOptionUsageResponseSchema.parse({
      items: paginatedItems,
      total: filtered.length,
      page,
      limit,
    });

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('[GET /crm/members/[id]/contracts/option-usage]', error);
    return NextResponse.json({ error: 'Failed to fetch option usage' }, { status: 500 });
  }
}
