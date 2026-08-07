import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  GetPointsQuerySchema,
  type GetPointsResponse,
  GetPointsResponseSchema,
  type PointAdjustmentRequest,
  PointAdjustmentRequestSchema,
  type PointAdjustmentResponse,
  PointAdjustmentResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for GET route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/points',
  summary: 'Get member points',
  description: 'Get points information for a member',
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
      name: 'period',
      in: 'query',
      required: false,
      description: 'Point history period filter',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetPointsResponseSchema,
      description: 'Points information',
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

// Register OpenAPI documentation for POST route
registerRoute({
  method: 'post',
  path: '/crm/members/{id}/points',
  summary: 'Adjust member points',
  description: 'Adjust points for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: PointAdjustmentRequestSchema,
    description: 'Point adjustment details',
  },
  responses: [
    {
      status: 200,
      schema: PointAdjustmentResponseSchema,
      description: 'Points adjusted successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
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

/** Mock data for GET /crm/members/{id}/points — ポイントタブ用（member_points, member_point_histories 想定） */
type PointHistoryItem = {
  id: string;
  date: string;
  reason: string;
  points: number;
};

function getFilterStartDate(period: 'all' | 'this_month' | 'last_3_months' | 'last_1_year') {
  const now = new Date();
  if (period === 'all') return null;
  if (period === 'this_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'last_3_months') {
    return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  }
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

function filterHistoryByPeriod(
  list: PointHistoryItem[],
  period: 'all' | 'this_month' | 'last_3_months' | 'last_1_year',
) {
  const startDate = getFilterStartDate(period);
  if (!startDate) return list;
  return list.filter((item) => new Date(item.date) >= startDate);
}

function buildMockPoints(
  memberId: string,
  period: 'all' | 'this_month' | 'last_3_months' | 'last_1_year',
): GetPointsResponse {
  const earnHistory: PointHistoryItem[] = [
    {
      id: 'earn-001',
      date: '2026-04-10T10:00:00+09:00',
      reason: '来館',
      points: 100,
    },
    {
      id: 'earn-002',
      date: '2026-03-15T14:00:00+09:00',
      reason: '友達紹介',
      points: 500,
    },
    {
      id: 'earn-003',
      date: '2026-02-10T09:00:00+09:00',
      reason: 'キャンペーン',
      points: 200,
    },
    {
      id: 'earn-004',
      date: '2025-10-05T11:00:00+09:00',
      reason: '来館',
      points: 80,
    },
    {
      id: 'earn-005',
      date: '2025-01-20T09:00:00+09:00',
      reason: '誕生日ボーナス',
      points: 300,
    },
  ];
  const spendHistory: PointHistoryItem[] = [
    {
      id: 'spend-001',
      date: '2026-04-08T10:00:00+09:00',
      reason: '月会費充当',
      points: 500,
    },
    {
      id: 'spend-002',
      date: '2026-03-18T12:00:00+09:00',
      reason: '商品交換',
      points: 300,
    },
    {
      id: 'spend-003',
      date: '2026-01-11T10:00:00+09:00',
      reason: 'ECサイト決済',
      points: 200,
    },
    {
      id: 'spend-004',
      date: '2025-02-01T10:00:00+09:00',
      reason: 'ギフト交換',
      points: 150,
    },
  ];

  const filteredEarnHistory = filterHistoryByPeriod(earnHistory, period);
  const filteredSpendHistory = filterHistoryByPeriod(spendHistory, period);

  const totalEarn = filteredEarnHistory.reduce((sum, item) => sum + item.points, 0);
  const totalSpend = filteredSpendHistory.reduce((sum, item) => sum + item.points, 0);

  return {
    point_balance: Math.max(0, 2000 + totalEarn - totalSpend),
    period,
    earn_history: filteredEarnHistory,
    spend_history: filteredSpendHistory,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const queryResult = GetPointsQuerySchema.safeParse({
      period: request.nextUrl.searchParams.get('period') ?? undefined,
    });
    const period = queryResult.success ? queryResult.data.period : 'all';
    const data = buildMockPoints(id, period);
    const response: GetPointsResponse = data as any;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = PointAdjustmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: PointAdjustmentRequest = validationResult.data;
    const response: PointAdjustmentResponse = {
      id,
      adjustment: validatedBody,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adjusting points:', error);
    return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 });
  }
}
