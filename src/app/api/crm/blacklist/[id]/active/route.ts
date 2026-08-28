import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ReleaseBlacklistBodySchema,
  ReleaseBlacklistResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { guardBlacklistRequest } from '@/app/api/crm/blacklist/_lib/guard';

// ─── PATCH /crm/blacklist/{id}/active ─────────────────────────────────────────

registerRoute({
  method: 'patch',
  path: '/crm/blacklist/{id}/active',
  summary: 'Release a blacklist entry',
  description:
    'A-01 FR-015 — releases (deactivates) an entry. The row is kept and `is_active` flipped, so the entry stays auditable; there is no physical delete. Accepts `{ "is_active": false }` only — re-listing goes through the register endpoint, which creates a fresh entry (FR-067). `member_status` is deliberately untouched: releasing a force-withdrawn member means "may enrol again", not "the withdrawal is undone" (FR-066).',
  tags: ['Blacklist'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: {
    schema: ReleaseBlacklistBodySchema,
    description: 'Release request body',
  },
  responses: [
    { status: 200, schema: ReleaseBlacklistResponseSchema, description: 'Entry released' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Blacklist entry not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Entry already released' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FR-062 gates the button to HQ/System; the same gate has to hold on the endpoint,
    // otherwise anyone can release an entry with a single request.
    const guard = guardBlacklistRequest(request);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    /**
     * Guards run in the contract's order — not-found before body validation, so a bad
     * body against a missing entry answers 404 rather than 400. The order is part of the
     * contract, not an implementation detail.
     */
    const existing = db.memberBlacklist.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Blacklist entry not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = ReleaseBlacklistBodySchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors || 'is_active must be false' }, { status: 400 });
    }

    const result = db.memberBlacklist.release(id);
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return NextResponse.json({ error: 'Blacklist entry not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'このブラックリスト登録はすでに解除されています。' },
        { status: 409 },
      );
    }

    return NextResponse.json({ blacklist: result.entry }, { status: 200 });
  } catch (err) {
    console.error('[PATCH /crm/blacklist/{id}/active]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
