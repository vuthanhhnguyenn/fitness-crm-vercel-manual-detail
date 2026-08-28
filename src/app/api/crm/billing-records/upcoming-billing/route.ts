import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetUpcomingBillingQuery,
  GetUpcomingBillingQuerySchema,
  GetUpcomingBillingResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/upcoming-billing',
  summary: 'List next-month upcoming billing entries',
  description:
    'Unconfirmed next-calendar-month batch with an SBPS/JACCS summary computed over the full in-scope set (F-01 FR-011/FR-012)',
  tags: ['Billing'],
  query: GetUpcomingBillingQuerySchema,
  responses: [
    { status: 200, schema: GetUpcomingBillingResponseSchema, description: 'Upcoming billing list' },
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

    const validationResult = GetUpcomingBillingQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetUpcomingBillingQuery = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const response = db.billingRecords.getUpcomingBilling(query, scope);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/billing-records/upcoming-billing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming billing entries' },
      { status: 500 },
    );
  }
}
