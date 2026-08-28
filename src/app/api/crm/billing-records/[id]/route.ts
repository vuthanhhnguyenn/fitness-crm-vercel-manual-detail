import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetBillingRecordDetailResponseSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/{id}',
  summary: 'Get billing record detail',
  description:
    'Basic info, line items (each with payment status), fee-adjustment/refund history for one billing record (F-01 FR-008)',
  tags: ['Billing'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Billing record ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetBillingRecordDetailResponseSchema,
      description: 'Billing record detail',
    },
    { status: 404, description: 'Billing record not found' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const detail = db.billingRecords.getById(id, scope);
    if (!detail) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error('GET /crm/billing-records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing record detail' }, { status: 500 });
  }
}
