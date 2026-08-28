import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetBillingRecordsQuery,
  GetBillingRecordsQuerySchema,
  GetBillingRecordsResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records',
  summary: 'List billing records',
  description:
    'Store/month-scoped billing (sales) record list with type/status/unpaid/search filters, sorted and paginated (F-01)',
  tags: ['Billing'],
  query: GetBillingRecordsQuerySchema,
  responses: [
    { status: 200, schema: GetBillingRecordsResponseSchema, description: 'Billing record list' },
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

    const validationResult = GetBillingRecordsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetBillingRecordsQuery = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const response = db.billingRecords.getList(query, scope);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/billing-records error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing records' }, { status: 500 });
  }
}
