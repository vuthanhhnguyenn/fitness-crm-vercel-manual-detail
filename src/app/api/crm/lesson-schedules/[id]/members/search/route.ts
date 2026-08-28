import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { SEED_RESERVATION_SEARCH_MEMBERS } from '@/app/api/_mock-db/seeds/lesson.seed';
import {
  ErrorResponseSchema,
  MemberSearchQuerySchema,
  type MemberSearchResponse,
  MemberSearchResponseSchema,
  type MemberSearchResult,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

/** Deterministic 0-4 spread so eligible/zero-remaining/penalty members are all searchable. */
function hashToRange(id: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + (id.codePointAt(i) ?? 0)) % 100000;
  }
  return hash % range;
}

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

    const query = parsed.data.q.normalize('NFKC').toLowerCase();

    const curatedMatches: MemberSearchResult[] = SEED_RESERVATION_SEARCH_MEMBERS.filter((m) => {
      const name = m.name.normalize('NFKC').toLowerCase();
      const memberId = m.member_id.normalize('NFKC').toLowerCase();
      return name.includes(query) || memberId.includes(query);
    }).map((m) => ({
      member_id: m.member_id,
      name: m.name,
      remaining_sessions: m.remaining_sessions,
      penalty_active: m.penalty_active,
      penalty_end_date: m.penalty_end_date,
    }));

    const allMembers = db.members.getList();
    const filtered = allMembers.filter((m) => {
      const nameKanji = m.name_kanji.normalize('NFKC').toLowerCase();
      const nameKana = m.name_kana.normalize('NFKC').toLowerCase();
      const memberNumber = m.member_number.normalize('NFKC').toLowerCase();
      return nameKanji.includes(query) || nameKana.includes(query) || memberNumber.includes(query);
    });

    const genericMatches: MemberSearchResult[] = filtered.map((m) => {
      const remainingSessions = hashToRange(m.id, 5);
      const penaltyActive = remainingSessions > 0 && hashToRange(m.id, 7) === 0;
      return {
        member_id: m.id,
        name: m.name_kanji,
        remaining_sessions: remainingSessions,
        penalty_active: penaltyActive,
        penalty_end_date: penaltyActive ? '2026-08-20' : null,
      };
    });

    const response: MemberSearchResponse = { members: [...curatedMatches, ...genericMatches] };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`GET /crm/lesson-schedules/${scheduleId}/members/search error:`, error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
}
