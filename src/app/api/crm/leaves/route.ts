import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
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
  description:
    'Paginated list of the four in-flight suspension/withdrawal display states. Completed and cancelled applications never appear. The caller store scope is applied before any user filter.',
  tags: ['Leaves'],
  query: GetLeavesQuerySchema,
  responses: [
    { status: 200, schema: GetLeavesResponseSchema, description: 'List of leaves' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

/**
 * Rows store 予定日 in the Japanese display format, and at two precisions: a suspension
 * carries the start month (`YYYY/MM`), a withdrawal the exact day (`YYYY/MM/DD`). Both are
 * normalised to `YYYY-MM-DD` so a single lexicographic comparison covers them — a month
 * counts as its first day, which is what makes 今月 match a suspension starting that month.
 */
function toComparableScheduledDate(scheduledDate: string): string {
  const iso = scheduledDate.replaceAll('/', '-');
  return iso.length === 7 ? `${iso}-01` : iso;
}

export async function GET(request: NextRequest) {
  try {
    // ── Authorisation & store scope (FR-001 – FR-003) ─────────────────────────
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    // Trainer cannot view A-03 at all (A-03 権限マトリクス).
    if (authResult.user.role === 'Trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

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
      scope_store_id,
      store_id,
      member_id,
      scheduled_from,
      scheduled_to,
      sort_by = 'scheduled_date',
      sort_order = 'asc',
    } = query;

    // ── Scope first, then user filters (FR-003) ───────────────────────────────
    // The scope is the role's allowed stores narrowed by the caller's header store
    // selection. `scope_store_id` is deliberately distinct from the in-screen `store_id`
    // filter: only the former counts toward `total_all`, because the banner reports the
    // in-screen filters against the scope, and the header scope is not one of them (FR-026).
    const scoped = db.memberLeaves
      .list()
      .filter((l) => allowedStoreIds === null || allowedStoreIds.includes(l.store_id))
      .filter((l) => !scope_store_id || l.store_id === scope_store_id);

    // Baseline count for the filter-result banner (FR-024 / FR-027).
    const total_all = scoped.length;

    let leaves = scoped;

    // ── Filtering ─────────────────────────────────────────────────────────────
    if (search) {
      const q = search.toLowerCase();
      leaves = leaves.filter(
        (l) =>
          l.application_number.toLowerCase().includes(q) ||
          l.member_number.toLowerCase().includes(q) ||
          l.member_name.toLowerCase().includes(q),
      );
    }

    if (type) {
      leaves = leaves.filter((l) => l.type === type);
    }

    if (status) {
      leaves = leaves.filter((l) => l.status === status);
    }

    if (brand) {
      leaves = leaves.filter((l) => l.brand === brand);
    }

    if (store_id) {
      leaves = leaves.filter((l) => l.store_id === store_id);
    }

    // Narrows the list to one member's applications (A-01-01 → A-03 drill-down).
    if (member_id) {
      leaves = leaves.filter((l) => l.member_id === member_id);
    }

    // FR-025a — an inclusive scheduled-date range. Both bounds are optional and independent,
    // so an open-ended range narrows on one side only.
    if (scheduled_from || scheduled_to) {
      leaves = leaves.filter((l) => {
        const d = toComparableScheduledDate(l.scheduled_date);
        if (scheduled_from && d < scheduled_from) return false;
        if (scheduled_to && d > scheduled_to) return false;
        return true;
      });
    }

    // ── Sorting (FR-035a — default: most imminent scheduled date first) ───────
    leaves = [...leaves].sort((a, b) => {
      const aVal = sort_by === 'applied_at' ? a.applied_at : a.scheduled_date;
      const bVal = sort_by === 'applied_at' ? b.applied_at : b.scheduled_date;
      const cmp = aVal.localeCompare(bVal, 'ja');
      return sort_order === 'asc' ? cmp : -cmp;
    });

    // ── Pagination (FR-034 — clamp to the last available page) ────────────────
    const total = leaves.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, total_pages);
    const start = (safePage - 1) * limit;
    const paginatedLeaves = leaves.slice(start, start + limit);

    return NextResponse.json(
      GetLeavesResponseSchema.parse({
        leaves: paginatedLeaves,
        total,
        total_all,
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
