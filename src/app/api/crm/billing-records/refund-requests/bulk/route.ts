import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { RefundRequesterRole } from '@/app/api/_schemas/billing.schema';
import {
  SubmitBulkRefundRequestSchema,
  SubmitBulkRefundResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/refund-requests/bulk',
  summary: 'Submit a list-level simplified refund request',
  description:
    'One reason (code) + free-text detail applied as a full RefundRequest per selected record, each deriving handling independently (F-01 FR-004)',
  tags: ['Billing'],
  requestBody: { schema: SubmitBulkRefundRequestSchema },
  responses: [
    { status: 200, schema: SubmitBulkRefundResponseSchema, description: 'Created refund requests' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR_ID = '10001';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'refund')) {
      return NextResponse.json(
        { error: 'You do not have permission to request refunds' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = SubmitBulkRefundRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const { billing_record_ids, reason_code, detail } = validationResult.data;
    const created = db.billingRecords.createBulkRefundRequests(
      billing_record_ids,
      reason_code,
      detail ?? null,
      { id: MOCK_OPERATOR_ID, name: MOCK_OPERATOR, role: MOCK_ROLE as RefundRequesterRole },
      scope,
    );

    return NextResponse.json({ created });
  } catch (error) {
    console.error('POST /crm/billing-records/refund-requests/bulk error:', error);
    return NextResponse.json({ error: 'Failed to submit refund requests' }, { status: 500 });
  }
}
