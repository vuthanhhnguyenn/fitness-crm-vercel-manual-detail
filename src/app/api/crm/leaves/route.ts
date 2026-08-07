import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetLeavesQuery,
  GetLeavesQuerySchema,
  GetLeavesResponseSchema,
} from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/leaves',
  summary: 'Get leaves list',
  description: 'Get paginated list of leave/withdrawal requests with filtering and sorting',
  tags: ['Leaves'],
  query: GetLeavesQuerySchema,
  responses: [
    { status: 200, schema: GetLeavesResponseSchema, description: 'List of leaves' },
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

    const validationResult = GetLeavesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetLeavesQuery = validationResult.data;
    const {
      page,
      limit,
      search = '',
      type,
      status,
      brand,
      store_id,
      scheduled_period,
      sort_by = 'applied_at',
      sort_order = 'desc',
    } = query;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextYearMonth = `${nextMonth.getFullYear()}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = String(now.getFullYear());

    let leaves = db.memberLeaves.list();

    // ── Filtering ─────────────────────────────────────────────────────────────
    if (search) {
      const q = search.toLowerCase();
      leaves = leaves.filter(
        (l) => l.id.toLowerCase().includes(q) || l.member_name.includes(search),
      );
    }

    if (type) {
      leaves = leaves.filter((l) => l.type === type);
    }

    if (status) {
      leaves = leaves.filter((l) => l.status === status);
    }

    if (brand) {
      leaves = leaves.filter((l) => l.brand.toLowerCase() === brand.toLowerCase());
    }

    if (store_id) {
      leaves = leaves.filter((l) => l.store_id === store_id);
    }

    if (scheduled_period) {
      leaves = leaves.filter((l) => {
        const d = l.scheduled_date;
        if (scheduled_period === 'current_month') return d.startsWith(currentYearMonth);
        if (scheduled_period === 'next_month') return d.startsWith(nextYearMonth);
        if (scheduled_period === 'current_year') return d.startsWith(currentYear);
        return true;
      });
    }

    // ── Sorting ───────────────────────────────────────────────────────────────
    leaves = [...leaves].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sort_by === 'applied_at') {
        aVal = a.applied_at;
        bVal = b.applied_at;
      } else if (sort_by === 'scheduled_date') {
        aVal = a.scheduled_date;
        bVal = b.scheduled_date;
      } else if (sort_by === 'id') {
        aVal = a.id;
        bVal = b.id;
      }
      const cmp = aVal.localeCompare(bVal, 'ja');
      return sort_order === 'asc' ? cmp : -cmp;
    });

    // ── Pagination ────────────────────────────────────────────────────────────
    const total = leaves.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, total_pages);
    const start = (safePage - 1) * limit;
    const paginatedLeaves = leaves.slice(start, start + limit);

    return NextResponse.json(
      GetLeavesResponseSchema.parse({
        leaves: paginatedLeaves,
        total,
        page: safePage,
        limit,
        total_pages,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('[GET /crm/leaves]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
