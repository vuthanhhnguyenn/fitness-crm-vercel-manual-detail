import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { AddLineItemRequestSchema, BillingLineItemSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/{id}/line-items',
  summary: 'Add a line item to a billing record',
  description:
    'Add a contract-sourced or manual line item; blocked on confirmed records and when the member has an outstanding balance (F-01 FR-009)',
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
  requestBody: { schema: AddLineItemRequestSchema },
  responses: [
    { status: 201, schema: BillingLineItemSchema, description: 'Created line item' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record not found' },
    { status: 409, description: 'Billing record is confirmed' },
    { status: 422, description: 'Member has an outstanding unpaid balance' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'line-item-add')) {
      return NextResponse.json(
        { error: 'You do not have permission to add line items' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = AddLineItemRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.addLineItem(id, validationResult.data, MOCK_OPERATOR, scope);
    if (!result.ok) {
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
      }
      if (result.error === 'confirmed') {
        return NextResponse.json({ error: 'billing record is confirmed' }, { status: 409 });
      }
      if (result.error === 'outstanding_balance') {
        return NextResponse.json(
          { error: 'member has an outstanding unpaid balance' },
          { status: 422 },
        );
      }
      return NextResponse.json({ error: 'Invalid contract_id' }, { status: 400 });
    }

    return NextResponse.json(result.lineItem, { status: 201 });
  } catch (error) {
    console.error('POST /crm/billing-records/[id]/line-items error:', error);
    return NextResponse.json({ error: 'Failed to add line item' }, { status: 500 });
  }
}
