import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import {
  isTransferVisible,
  roleHasPermission,
  withCanAct,
} from '@/app/api/_lib/transfer-permission';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetTransfersQuery,
  GetTransfersQuerySchema,
  type GetTransfersResponse,
  GetTransfersResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/transfers',
  summary: 'Get transfer requests list',
  description:
    'Get a paginated, filterable list of transfer requests, scoped to the stores the caller can access (matching either the origin or the destination store)',
  tags: ['Transfers'],
  query: GetTransfersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetTransfersResponseSchema,
      description: 'List of transfer requests',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden - no accessible stores' },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

/** Intersects the requested `store_id` scope with the caller's role-based store scope. */
function resolveStoreScope(
  allowedStoreIds: string[] | null,
  requestedStoreId: string | undefined,
): string[] | null {
  const requested = requestedStoreId && requestedStoreId !== 'all' ? [requestedStoreId] : null;
  if (allowedStoreIds === null) return requested;
  if (requested === null) return allowedStoreIds;
  return requested.filter((id) => allowedStoreIds.includes(id));
}

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    // Trainer holds no MembersTransfersView, so the page guard redirects them to /403 — but the
    // endpoint has to say no as well, or a direct call still hands them other stores' data.
    if (!roleHasPermission(user, Permission.MembersTransfersView)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedStoreIds = getAllowedStoreIds(user);
    if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Build query object from searchParams
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    // Validate query parameters with Zod
    const validationResult = GetTransfersQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetTransfersQuery = validationResult.data;
    const {
      page,
      limit,
      search = '',
      status,
      from_store_id,
      to_store_id,
      store_id,
      brand,
      applied_period,
      auto_transfer,
      sort_by = 'applied_at',
      sort_order = 'desc',
    } = query;

    const scope = resolveStoreScope(allowedStoreIds, store_id);
    if (scope !== null && scope.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Store scope first, so `total` reflects the scoped-and-filtered count and the filter
    // banner cannot disagree with the pagination summary (PAR015, PAR034).
    const scoped = db.transfers.getAll().filter((t) => isTransferVisible(t, scope));
    const scopedTotal = scoped.length;
    let filtered = scoped;

    // Apply free-text search on id and member_name
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchLower) ||
          t.member_name.toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Apply from_store_id filter
    if (from_store_id) {
      filtered = filtered.filter((t) => t.from_store_id === from_store_id);
    }

    // Apply to_store_id filter
    if (to_store_id) {
      filtered = filtered.filter((t) => t.to_store_id === to_store_id);
    }

    // Apply brand filter
    if (brand) {
      filtered = filtered.filter((t) => t.brand === brand);
    }

    // FR-006: eligibility is a JOYFIT concept, so both options exclude FIT365 entirely.
    if (auto_transfer === 'eligible') {
      filtered = filtered.filter((t) => t.brand === 'joyfit' && t.auto_transfer_eligible === true);
    } else if (auto_transfer === 'excluded') {
      filtered = filtered.filter((t) => t.brand === 'joyfit' && t.auto_transfer_eligible === false);
    }

    // Apply applied_period filter
    if (applied_period) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      filtered = filtered.filter((t) => {
        const applied = new Date(t.applied_at);
        if (applied_period === 'this_month') {
          return applied.getFullYear() === year && applied.getMonth() === month;
        }
        if (applied_period === 'last_month') {
          const lastMonth = month === 0 ? 11 : month - 1;
          const lastMonthYear = month === 0 ? year - 1 : year;
          return applied.getFullYear() === lastMonthYear && applied.getMonth() === lastMonth;
        }
        // this_year
        return applied.getFullYear() === year;
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sort_by === 'applied_at') {
        comparison = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      } else if (sort_by === 'scheduled_date') {
        comparison = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
      } else if (sort_by === 'member_name') {
        comparison = a.member_name.localeCompare(b.member_name, 'ja');
      } else if (sort_by === 'id') {
        comparison = a.id.localeCompare(b.id);
      }
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const transfers = filtered
      .slice(startIndex, startIndex + limit)
      .map((t) => withCanAct(t, user));

    const response: GetTransfersResponse = {
      transfers,
      pagination: { page, limit, total, total_pages, scoped_total: scopedTotal },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}
