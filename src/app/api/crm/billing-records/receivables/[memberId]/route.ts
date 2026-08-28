import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetUnpaidDetailResponseSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/receivables/{memberId}',
  summary: 'Get unpaid detail for a member',
  description:
    'Per-member unpaid-balance detail with JACCS-subrogation eligibility per line item (F-01 FR-007)',
  tags: ['Billing'],
  parameters: [
    {
      name: 'memberId',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Member ID',
    },
  ],
  responses: [
    { status: 200, schema: GetUnpaidDetailResponseSchema, description: 'Unpaid detail' },
    { status: 403, description: 'Sales data is not available for this role' },
    { status: 404, description: 'Member has no in-scope outstanding records' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    if (MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'Sales data is not available for this role' },
        { status: 403 },
      );
    }

    const { memberId } = await params;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const detail = db.billingRecords.getUnpaidDetail(memberId, scope);
    if (!detail) {
      return NextResponse.json({ error: 'Member has no outstanding records' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('GET /crm/billing-records/receivables/[memberId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch unpaid detail' }, { status: 500 });
  }
}
