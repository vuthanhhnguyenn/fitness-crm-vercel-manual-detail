import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BillingSummarySchema,
  GetBillingRecordsSummaryQuerySchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/summary',
  summary: 'Get billing summary KPIs',
  description:
    'Store/month-scoped sales summary — total sales/payments/outstanding/refunds and confirmed/unconfirmed/bad-debt counts (F-01 FR-001)',
  tags: ['Billing'],
  query: GetBillingRecordsSummaryQuerySchema,
  responses: [
    { status: 200, schema: BillingSummarySchema, description: 'Billing summary' },
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
    const validationResult = GetBillingRecordsSummaryQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const summary = db.billingRecords.getSummary(validationResult.data, scope);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('GET /crm/billing-records/summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing summary' }, { status: 500 });
  }
}
