import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetDayPassHistoryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

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

const MOCK_DAY_PASS_HISTORY = [
  {
    id: 'dp-001',
    purchased_at: '2025-02-10',
    store_name: 'JOYFIT渋谷店',
    amount: 1100,
    expires_at: '2025-02-10',
    status: 'used' as const,
  },
  {
    id: 'dp-002',
    purchased_at: '2025-01-05',
    store_name: 'JOYFIT新宿店',
    amount: 1100,
    expires_at: '2025-01-05',
    status: 'used' as const,
  },
  {
    id: 'dp-003',
    purchased_at: '2024-12-20',
    store_name: 'JOYFIT渋谷店',
    amount: 1100,
    expires_at: '2024-12-20',
    status: 'used' as const,
  },
  {
    id: 'dp-004',
    purchased_at: '2024-11-15',
    store_name: 'JOYFIT池袋店',
    amount: 1100,
    expires_at: '2024-11-15',
    status: 'used' as const,
  },
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Return mock data; in production this would be queried by member ID
    return NextResponse.json({ day_pass_history: MOCK_DAY_PASS_HISTORY });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch day pass history' }, { status: 500 });
  }
}
