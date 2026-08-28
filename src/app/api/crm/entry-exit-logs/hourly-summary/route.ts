import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEntryExitHourlySummaryQuery,
  GetEntryExitHourlySummaryQuerySchema,
  GetEntryExitHourlySummaryResponseSchema,
} from '@/app/api/_schemas/entry-exit-log.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/entry-exit-logs/hourly-summary',
  summary: 'Get hourly entry-count summary',
  description:
    'Get entry counts bucketed by hour (06:00-22:00) for the "時間帯別入館者数" chart (FR-B01-08)',
  tags: ['Entry-Exit'],
  query: GetEntryExitHourlySummaryQuerySchema,
  responses: [
    { status: 200, schema: GetEntryExitHourlySummaryResponseSchema, description: 'Hourly counts' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
  ],
});

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
  const parsed = GetEntryExitHourlySummaryQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query: GetEntryExitHourlySummaryQuery = parsed.data;
  const storeIds = resolveStoreScope(allowedStoreIds, query.store_id);

  const data = db.entryExitLogs.getHourlySummary({ date: query.date ?? '', storeIds });

  return NextResponse.json({ data });
}
