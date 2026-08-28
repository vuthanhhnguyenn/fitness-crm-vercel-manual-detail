import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEntryExitHistoryQuery,
  GetEntryExitHistoryQuerySchema,
  GetEntryExitHistoryResponseSchema,
} from '@/app/api/_schemas/entry-exit-log.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/entry-exit-logs/history',
  summary: 'Get entry-exit visit history (B-01-01)',
  description:
    'Get a paginated, filterable, searchable list of past visits (completed, in-progress, or denied), scoped to the caller’s accessible stores',
  tags: ['Entry-Exit'],
  query: GetEntryExitHistoryQuerySchema,
  responses: [
    { status: 200, schema: GetEntryExitHistoryResponseSchema, description: 'Visit history page' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
  ],
});

/** Intersects the requested `store_id` filter with the caller's role-based store scope. */
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
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const allowedStoreIds = getAllowedStoreIds(authResult.user);
  if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const queryObj: Record<string, string | undefined> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });
  const parsed = GetEntryExitHistoryQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query: GetEntryExitHistoryQuery = parsed.data;
  const storeIds = resolveStoreScope(allowedStoreIds, query.store_id);

  const { rows, total } = db.entryExitLogs.listHistory({
    search: query.search,
    dateFrom: query.date_from,
    dateTo: query.date_to,
    storeIds,
    authMethod: query.auth_method,
    result: query.result,
    sortBy: query.sort_by,
    sortOrder: query.sort_order,
    page: query.page,
    limit: query.limit,
  });

  return NextResponse.json({
    history: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
}
