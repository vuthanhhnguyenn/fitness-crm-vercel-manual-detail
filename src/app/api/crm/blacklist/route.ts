import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetBlacklistQuery,
  GetBlacklistQuerySchema,
  GetBlacklistResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { guardBlacklistRequest } from '@/app/api/crm/blacklist/_lib/guard';

// ─── GET /crm/blacklist ───────────────────────────────────────────────────────

registerRoute({
  method: 'get',
  path: '/crm/blacklist',
  summary: 'Get blacklist',
  description:
    'A-01 FR-015 — cross-store blacklist list for HQ. Active entries only unless `is_active=false` is requested explicitly; no screen control does. Default ordering is `registered_at` descending.',
  tags: ['Blacklist'],
  query: GetBlacklistQuerySchema,
  responses: [
    { status: 200, schema: GetBlacklistResponseSchema, description: 'Blacklist entries' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    // FR-001 – FR-003 — HQ/System only, enforced here and not just by the screen.
    const guard = guardBlacklistRequest(request);
    if (!guard.ok) return guard.response;

    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const parsed = GetBlacklistQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetBlacklistQuery = parsed.data;
    const { page, limit, search, source, unpaid, is_active, include_total_all } = query;

    const filters = { search, source, unpaid, is_active };
    const rows = db.memberBlacklist.list(filters);

    const total = rows.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    // FR-029a — an over-range page clamps rather than returning an empty table; the
    // response reports the page it actually served so the client can correct its URL.
    const safePage = Math.min(page, total_pages);
    const start = (safePage - 1) * limit;
    const blacklist = rows.slice(start, start + limit);

    return NextResponse.json(
      {
        blacklist,
        total,
        // FR-025 — only computed when the banner needs it.
        ...(include_total_all ? { total_all: db.memberBlacklist.countBaseline(filters) } : {}),
        page: safePage,
        limit,
        total_pages,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[GET /crm/blacklist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
