import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetManualReservationMembersResponse,
  GetManualReservationMembersResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/manual-reservation/members',
  summary: 'List manual reservation members',
  description: 'Get the member list selectable for manual reservation input (D-01 FR-006)',
  tags: ['LessonSchedules'],
  responses: [
    { status: 200, schema: GetManualReservationMembersResponseSchema, description: 'Member list' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    const members = db.lessonSchedules.getManualReservationMembers();
    const response: GetManualReservationMembersResponse = { members };
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/lesson-schedules/manual-reservation/members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
