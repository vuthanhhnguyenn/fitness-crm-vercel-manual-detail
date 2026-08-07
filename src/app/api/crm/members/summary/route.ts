import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetMembersSummaryResponse,
  GetMembersSummaryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/summary',
  summary: 'Get members summary',
  description: 'Aggregate KPI statistics for the members list dashboard',
  tags: ['Members'],
  responses: [
    {
      status: 200,
      schema: GetMembersSummaryResponseSchema,
      description: 'Summary statistics',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET() {
  try {
    const raw = db.members.getSummary();
    const parsed = GetMembersSummaryResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('Members summary validation failed:', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid summary payload' }, { status: 500 });
    }
    const summary: GetMembersSummaryResponse = parsed.data;
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching members summary:', error);
    return NextResponse.json({ error: 'Failed to fetch members summary' }, { status: 500 });
  }
}
