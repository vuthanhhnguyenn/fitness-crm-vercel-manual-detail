import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ApplyFeeAdjustmentRequestSchema,
  FeeAdjustmentSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/{id}/fee-adjustments',
  summary: 'Apply a fee adjustment',
  description:
    'Apply a fee adjustment to the whole record or a specific line item; appends an immutable history row (F-01 FR-010)',
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
  requestBody: { schema: ApplyFeeAdjustmentRequestSchema },
  responses: [
    { status: 201, schema: FeeAdjustmentSchema, description: 'Created fee adjustment' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record not found' },
    { status: 409, description: 'Billing record is confirmed' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'fee-adjust')) {
      return NextResponse.json(
        { error: 'You do not have permission to adjust fees' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = ApplyFeeAdjustmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.applyFeeAdjustment(
      id,
      validationResult.data,
      MOCK_OPERATOR,
      scope,
    );
    if (!result.ok) {
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'billing record is confirmed' }, { status: 409 });
    }

    return NextResponse.json(result.feeAdjustment, { status: 201 });
  } catch (error) {
    console.error('POST /crm/billing-records/[id]/fee-adjustments error:', error);
    return NextResponse.json({ error: 'Failed to apply fee adjustment' }, { status: 500 });
  }
}
