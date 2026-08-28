import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { RefundRequesterRole } from '@/app/api/_schemas/billing.schema';
import { RefundRequestSchema, SubmitRefundRequestSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/{id}/refund-requests',
  summary: 'Submit a refund request for a billing record',
  description:
    'Full or partial refund request from the detail screen; handling/reversal-window derived from payment method (F-01 FR-011)',
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
  requestBody: { schema: SubmitRefundRequestSchema },
  responses: [
    { status: 201, schema: RefundRequestSchema, description: 'Created refund request' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record not found' },
    { status: 422, description: 'Partial refund amount exceeds line item amount' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR_ID = '10001';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'refund')) {
      return NextResponse.json(
        { error: 'You do not have permission to request refunds' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = SubmitRefundRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.createRefundRequest(
      id,
      validationResult.data,
      { id: MOCK_OPERATOR_ID, name: MOCK_OPERATOR, role: MOCK_ROLE as RefundRequesterRole },
      scope,
    );
    if (!result.ok) {
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Refund amount exceeds the line item amount' },
        { status: 422 },
      );
    }

    return NextResponse.json(result.refundRequest, { status: 201 });
  } catch (error) {
    console.error('POST /crm/billing-records/[id]/refund-requests error:', error);
    return NextResponse.json({ error: 'Failed to submit refund request' }, { status: 500 });
  }
}
