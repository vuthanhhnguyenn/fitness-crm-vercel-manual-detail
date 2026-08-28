import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetRefundQueueQuery,
  GetRefundQueueQuerySchema,
  GetRefundQueueResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/refund-requests',
  summary: 'List the refund approval queue',
  description:
    "Refund requests (pending/completed/rejected) across the caller's store scope, with a full-in-scope pending-count/amount banner (F-01 FR-014/FR-015)",
  tags: ['Billing'],
  query: GetRefundQueueQuerySchema,
  responses: [
    { status: 200, schema: GetRefundQueueResponseSchema, description: 'Refund queue list' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Sales data is not available for this role' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(request: NextRequest) {
  try {
    if (MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'Sales data is not available for this role' },
        { status: 403 },
      );
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetRefundQueueQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetRefundQueueQuery = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const response = db.billingRecords.getRefundQueue(query, scope);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/billing-records/refund-requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch refund queue' }, { status: 500 });
  }
}
