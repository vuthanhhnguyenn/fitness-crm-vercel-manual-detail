import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetUnpaidReceivablesQuery,
  GetUnpaidReceivablesQuerySchema,
  GetUnpaidReceivablesResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/receivables',
  summary: 'List unpaid receivables',
  description:
    "Member-grouped unpaid-balance summary (未回収一覧), scoped to the caller's store authorization (F-01 FR-006)",
  tags: ['Billing'],
  query: GetUnpaidReceivablesQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetUnpaidReceivablesResponseSchema,
      description: 'Unpaid receivable list',
    },
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

    const validationResult = GetUnpaidReceivablesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetUnpaidReceivablesQuery = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const response = db.billingRecords.getUnpaidReceivables(query, scope);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/billing-records/receivables error:', error);
    return NextResponse.json({ error: 'Failed to fetch unpaid receivables' }, { status: 500 });
  }
}
