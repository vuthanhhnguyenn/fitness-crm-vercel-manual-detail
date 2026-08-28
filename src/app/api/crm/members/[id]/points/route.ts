import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { BRAND_POINT_NAMES } from '@/app/api/_mock-db/seeds/brand.seed';
import {
  ErrorResponseSchema,
  type GetPointsResponse,
  GetPointsResponseSchema,
  type PointAdjustmentRequest,
  PointAdjustmentRequestSchema,
  type PointAdjustmentResponse,
  PointAdjustmentResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { format } from 'date-fns';

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

/** Mock data for GET /crm/members/{id}/points — for the points tab (assumes member_points, member_point_histories) */
type PointHistoryItem = {
  id: string;
  date: string;
  reason: string;
  points: number;
};

// Generated relative to "now" so the default month (current month) always has
// data, and recent months are populated too (for MonthPicker navigation).
function buildMockPoints(
  fromTime: number | null,
  toTime: number | null,
  pointName: string,
): GetPointsResponse {
  const now = new Date();
  const ymd = (offsetDays: number) =>
    format(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetDays), 'yyyy-MM-dd');

  const earnHistory: PointHistoryItem[] = [
    { id: 'earn-001', date: ymd(2), reason: '来館', points: 100 },
    { id: 'earn-002', date: ymd(12), reason: '友達紹介', points: 500 },
    { id: 'earn-003', date: ymd(25), reason: 'キャンペーン', points: 200 },
    { id: 'earn-004', date: ymd(40), reason: '来館', points: 80 },
    { id: 'earn-005', date: ymd(70), reason: '誕生日ボーナス', points: 300 },
  ];
  const spendHistory: PointHistoryItem[] = [
    { id: 'spend-001', date: ymd(4), reason: '月会費充当', points: 500 },
    { id: 'spend-002', date: ymd(15), reason: '商品交換', points: 300 },
    { id: 'spend-003', date: ymd(33), reason: 'ECサイト決済', points: 200 },
    { id: 'spend-004', date: ymd(60), reason: 'ギフト交換', points: 150 },
  ];

  const inRange = (item: PointHistoryItem) => {
    const itemTime = new Date(`${item.date}T00:00:00`).getTime();
    const afterFrom = fromTime === null || itemTime >= fromTime;
    const beforeTo = toTime === null || itemTime <= toTime;
    return afterFrom && beforeTo;
  };

  const filteredEarnHistory = earnHistory.filter(inRange);
  const filteredSpendHistory = spendHistory.filter(inRange);

  const totalEarn = filteredEarnHistory.reduce((sum, item) => sum + item.points, 0);
  const totalSpend = filteredSpendHistory.reduce((sum, item) => sum + item.points, 0);

  return {
    pointBalance: Math.max(0, 2000 + totalEarn - totalSpend),
    pointName,
    period: 'all',
    earnHistory: filteredEarnHistory,
    spendHistory: filteredSpendHistory,
    expiringPoints: 200,
    expiringAt: '2026-06-30',
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    // `to` is inclusive of the whole day
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    // Per the design, the point name is resolved server-side from the brands master
    const member = db.members.get(id);
    // Point names are defined per brand GROUP (JOYFIT / FIT365), so they resolve
    // from `brandGroup`, not from the store's sub-brand.
    const pointName = (member && BRAND_POINT_NAMES[member.brandGroup]) || 'ポイント';

    const response = buildMockPoints(fromTime, toTime, pointName);
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
