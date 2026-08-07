import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  MemberSearchQuerySchema,
  type MemberSearchResponse,
  MemberSearchResponseSchema,
  type MemberSearchResult,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/{scheduleId}/members/search',
  summary: 'Search members',
  description: 'Search members by name query',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  query: MemberSearchQuerySchema,
  responses: [
    { status: 200, schema: MemberSearchResponseSchema, description: 'Member search results' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const q = request.nextUrl.searchParams.get('q') ?? '';
    const parsed = MemberSearchQuerySchema.safeParse({ q });
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query = parsed.data.q.toLowerCase();
    const allMembers = db.members.getList();
    const filtered = allMembers.filter(
      (m) =>
        m.name_kanji.toLowerCase().includes(query) || m.member_number.toLowerCase().includes(query),
    );

    const members: MemberSearchResult[] = filtered.map((m) => ({
      member_id: m.id,
      name: m.name_kanji,
      remaining_sessions: 0,
      penalty_active: false,
      penalty_end_date: null,
    }));

    const response: MemberSearchResponse = { members };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`GET /crm/lesson-schedules/${scheduleId}/members/search error:`, error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
}
