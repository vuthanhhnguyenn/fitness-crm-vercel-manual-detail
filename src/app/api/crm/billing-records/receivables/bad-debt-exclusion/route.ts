import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BadDebtExclusionRequestSchema,
  BadDebtExclusionResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/receivables/bad-debt-exclusion',
  summary: 'Exclude or release a member from bad-debt write-off',
  description:
    'Requires SalesBadDebtExclude (System/Headquarter/Manager only — Staff MUST NOT have access, F-01 FR-010); reason is required for both directions',
  tags: ['Billing'],
  requestBody: { schema: BadDebtExclusionRequestSchema },
  responses: [
    {
      status: 200,
      schema: BadDebtExclusionResponseSchema,
      description: 'Exclusion/release result',
    },
    { status: 400, description: 'Validation failure, or reason is required' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Member has no in-scope outstanding records' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest) {
  try {
    // SalesBadDebtExclude: System/Headquarter/Manager only — Staff is explicitly excluded
    // regardless of store scope (data-model.md permission table, FR-010).
    if (MOCK_ROLE === 'staff' || MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'You do not have permission to change bad-debt exclusion status' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = BadDebtExclusionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    if (!validationResult.data.reason.trim()) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.setBadDebtExclusion(
      validationResult.data,
      MOCK_OPERATOR,
      scope,
    );
    if (!result.ok) {
      return NextResponse.json({ error: 'Member has no outstanding records' }, { status: 404 });
    }

    return NextResponse.json(result.response);
  } catch (error) {
    console.error('POST /crm/billing-records/receivables/bad-debt-exclusion error:', error);
    return NextResponse.json(
      { error: 'Failed to update bad-debt exclusion status' },
      { status: 500 },
    );
  }
}
