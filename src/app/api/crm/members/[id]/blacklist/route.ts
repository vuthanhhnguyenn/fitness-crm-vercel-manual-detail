import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateBlacklistBodySchema,
  CreateBlacklistResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { guardBlacklistRequest } from '@/app/api/crm/blacklist/_lib/guard';

// ─── POST /crm/members/{id}/blacklist ─────────────────────────────────────────

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/blacklist',
  summary: 'Register a member to the blacklist',
  description:
    'A-01 FR-015 — the **single** registration endpoint, called by both the blacklist list Sheet and the member-detail dialog. `source` is never accepted from the request: every entry created here is written as `manual`; `forced_withdrawal` is reachable only from the forced-withdrawal path (FR-049). Not idempotent — a second call while an active entry exists returns 409.',
  tags: ['Blacklist'],
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
    schema: CreateBlacklistBodySchema,
    description: 'Blacklist registration payload',
  },
  responses: [
    { status: 201, schema: CreateBlacklistResponseSchema, description: 'Entry created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Member not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Member already blacklisted' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // A-01 L263 「BL登録操作: …手動登録（本部のみ）」 — both callers of this endpoint (the
    // list Sheet and the member-detail dialog) are HQ/System-only, so the endpoint is too.
    const guard = guardBlacklistRequest(request);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = CreateBlacklistBodySchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    /**
     * The guard chain lives in the table so both callers of this endpoint — the list
     * Sheet and the member-detail dialog — get the same one-active-row invariant. The
     * previous implementation wrote only to `member.blacklist` and never touched the
     * blacklist table, so an entry registered from the member detail never appeared on
     * the blacklist list at all.
     *
     * `create` also keeps the member's own denormalised `blacklist` flag in step, which is
     * what the member detail and the member list's `has_blacklist` read. That sync belongs
     * next to the release path's mirror of it, not here.
     */
    const result = db.memberBlacklist.create(id, parsed.data);
    if (!result.ok) {
      if (result.reason === 'member_not_found') {
        return NextResponse.json({ error: '指定された会員が見つかりません。' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'この会員はすでにブラックリストに登録されています。' },
        { status: 409 },
      );
    }

    return NextResponse.json({ blacklist: result.entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/blacklist]', error);
    return NextResponse.json({ error: 'Failed to register blacklist' }, { status: 500 });
  }
}
