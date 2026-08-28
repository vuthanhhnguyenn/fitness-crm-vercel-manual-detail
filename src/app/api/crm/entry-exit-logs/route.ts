import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEntryExitLogsQuery,
  GetEntryExitLogsQuerySchema,
  GetEntryExitLogsResponseSchema,
} from '@/app/api/_schemas/entry-exit-log.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/entry-exit-logs',
  summary: 'Get entry-exit activity list',
  description:
    'Get the most recent entry or exit activity rows (B-01 Phase 1 baseline) for a given date/store scope',
  tags: ['Entry-Exit'],
  query: GetEntryExitLogsQuerySchema,
  responses: [
    { status: 200, schema: GetEntryExitLogsResponseSchema, description: 'Activity rows' },
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
  const parsed = GetEntryExitLogsQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query: GetEntryExitLogsQuery = parsed.data;
  const storeIds = resolveStoreScope(allowedStoreIds, query.store_id);

  const data = db.entryExitLogs.listByDirection({
    direction: query.direction,
    limit: query.limit,
    date: query.date ?? '',
    storeIds,
  });

  return NextResponse.json({ data });
}
