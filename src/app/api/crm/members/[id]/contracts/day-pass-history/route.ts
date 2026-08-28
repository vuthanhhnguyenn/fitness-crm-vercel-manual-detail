import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type DayPassRecord,
  ErrorResponseSchema,
  GetDayPassHistoryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { addMonths, format } from 'date-fns';

type DayPassStatus = DayPassRecord['status'];

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/contracts/day-pass-history',
  summary: 'Get member day pass purchase history',
  description: 'Get 1DayPass purchase history records for a member',
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
      schema: GetDayPassHistoryResponseSchema,
      description: 'Day pass purchase history',
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

type DayPassHistoryMock = {
  id: string;
  purchasedAt: string;
  storeName: string;
  amount: number;
  expiresAt: string;
  status: DayPassStatus;
};

// Every status is represented so all five badges are reachable in the mock (gap P-02 / G-08)
const DAY_PASS_STATUS_CYCLE: DayPassStatus[] = [
  'used',
  'active',
  'pending_start',
  'expired',
  'cancelled',
  'used',
];

// Generated relative to "now" so the default month (current month) always has
// data, and recent months are populated too (for MonthPicker navigation).
function buildDayPassHistory(): DayPassHistoryMock[] {
  const stores = ['JOYFIT渋谷店', 'JOYFIT新宿店', 'JOYFIT池袋店'];
  const now = new Date();
  const records: DayPassHistoryMock[] = [];
  // ~6 purchases spread over the last ~5 months (covers current + recent months)
  for (let i = 0; i < 6; i++) {
    const purchased = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 25);
    // A-01 FR-019: a 1DayPass ticket is valid for 6 months from the purchase date
    const expires = addMonths(purchased, 6);
    records.push({
      id: `dp-${String(i + 1).padStart(3, '0')}`,
      purchasedAt: format(purchased, 'yyyy-MM-dd'),
      storeName: stores[i % stores.length]!,
      amount: 1100,
      expiresAt: format(expires, 'yyyy-MM-dd'),
      status: DAY_PASS_STATUS_CYCLE[i % DAY_PASS_STATUS_CYCLE.length]!,
    });
  }
  return records;
}

const MOCK_DAY_PASS_HISTORY: DayPassHistoryMock[] = buildDayPassHistory();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    // `to` is inclusive of the whole day
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    const filtered = MOCK_DAY_PASS_HISTORY.filter((record) => {
      const purchasedTime = new Date(`${record.purchasedAt}T00:00:00`).getTime();
      const afterFrom = fromTime === null || purchasedTime >= fromTime;
      const beforeTo = toTime === null || purchasedTime <= toTime;
      return afterFrom && beforeTo;
    });

    return NextResponse.json({ dayPassHistory: filtered });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch day pass history' }, { status: 500 });
  }
}
