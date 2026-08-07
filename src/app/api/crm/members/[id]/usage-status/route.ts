import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetUsageStatusResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/usage-status',
  summary: 'Get member usage status',
  description: 'Get visit counts and usage patterns for a member',
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
      schema: GetUsageStatusResponseSchema,
      description: 'Usage status information',
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

const TIME_SLOTS = [
  '06:00-08:00',
  '10:00-12:00',
  '12:00-14:00',
  '17:00-19:00',
  '18:00-20:00',
  '20:00-22:00',
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Deterministic mock data derived from member ID number
    const idNum = parseInt(id.replace(/\D/g, ''), 10) || 1;
    const monthlyVisits = 6 + (idNum % 20);
    const monthlyVisitsDiff = (idNum % 11) - 5; // -5 ~ +5
    const peakTimeSlot = TIME_SLOTS[idNum % TIME_SLOTS.length]!;

    const usageStatus = {
      monthly_visits: monthlyVisits,
      monthly_visits_diff: monthlyVisitsDiff,
      peak_time_slot: peakTimeSlot,
      frequent_store: member.profile.store_name ?? null,
    };

    return NextResponse.json(usageStatus);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch usage status' }, { status: 500 });
  }
}
