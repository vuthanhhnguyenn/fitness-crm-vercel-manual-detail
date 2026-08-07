import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetBlacklistQuery,
  GetBlacklistQuerySchema,
  GetBlacklistResponseSchema,
  type PostBlacklistBody,
  PostBlacklistBodySchema,
  PostBlacklistResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// ─── GET /crm/blacklist ───────────────────────────────────────────────────────

registerRoute({
  method: 'get',
  path: '/crm/blacklist',
  summary: 'Get blacklist',
  description: 'Get paginated blacklist entries with optional filtering',
  tags: ['Blacklist'],
  query: GetBlacklistQuerySchema,
  responses: [
    { status: 200, schema: GetBlacklistResponseSchema, description: 'Blacklist entries' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetBlacklistQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetBlacklistQuery = validationResult.data;
    const { page, limit, search = '', reason, unpaid } = query;

    let rows = db.memberBlacklist.getList();

    // ── Filtering ─────────────────────────────────────────────────────────────
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.memberId.toLowerCase().includes(q) || r.memberName.includes(search),
      );
    }

    if (reason) {
      rows = rows.filter((r) => r.registrationSource === reason);
    }

    if (unpaid) {
      if (unpaid === 'has_debt') {
        rows = rows.filter((r) => r.unpaidAmount > 0);
      } else if (unpaid === 'no_debt') {
        rows = rows.filter((r) => r.unpaidAmount === 0);
      }
    }

    // ── Sorting ───────────────────────────────────────────────────────────────
    rows = [...rows].sort((a, b) => {
      return b.registeredAt.localeCompare(a.registeredAt, 'ja');
    });

    // ── Pagination ────────────────────────────────────────────────────────────
    const total = rows.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, total_pages);
    const start = (safePage - 1) * limit;
    const blacklist = rows.slice(start, start + limit);

    return NextResponse.json(
      { blacklist, pagination: { page: safePage, limit, total, total_pages } },
      { status: 200 },
    );
  } catch (err) {
    console.error('[GET /crm/blacklist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /crm/blacklist ──────────────────────────────────────────────────────

registerRoute({
  method: 'post',
  path: '/crm/blacklist',
  summary: 'Register blacklist entry',
  description: 'Manually register a member on the blacklist',
  tags: ['Blacklist'],
  requestBody: {
    schema: PostBlacklistBodySchema,
    description: 'Blacklist registration request body',
  },
  responses: [
    { status: 201, schema: PostBlacklistResponseSchema, description: 'Entry created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = PostBlacklistBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data: PostBlacklistBody = validationResult.data;

    const blacklist = db.memberBlacklist.create({
      memberId: data.memberId,
      memberName: data.memberName,
      storeName: data.storeName ?? '',
      registrationSource: 'manual',
      manualReason: data.reason,
      unpaidAmount: 0,
      memo: data.memo ?? null,
      registeredBy: '佐藤 花子',
      matchConditions: {
        nameAndBirthdate: false,
        email: false,
        phone: false,
        address: false,
      },
    });

    return NextResponse.json({ blacklist }, { status: 201 });
  } catch (err) {
    console.error('[POST /crm/blacklist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
