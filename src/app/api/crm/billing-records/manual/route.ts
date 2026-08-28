import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ManualBillingRegistrationRequestSchema,
  ManualBillingRegistrationResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/manual',
  summary: 'Manually register a new billing record',
  description:
    'Ad-hoc billing registration; blocked when the member has an outstanding unpaid balance (F-01 FR-014/FR-015/FR-016/FR-017)',
  tags: ['Billing'],
  requestBody: { schema: ManualBillingRegistrationRequestSchema },
  responses: [
    {
      status: 201,
      schema: ManualBillingRegistrationResponseSchema,
      description: 'Created billing record',
    },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
    { status: 422, description: 'Member has an outstanding unpaid balance' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';

export async function POST(request: NextRequest) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'manual-register')) {
      return NextResponse.json(
        { error: 'You do not have permission to register billing records' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = ManualBillingRegistrationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const input = validationResult.data;
    if (input.confirmation_status === 'confirmed' && !canPerformSalesAction(MOCK_ROLE, 'confirm')) {
      return NextResponse.json(
        { error: 'You do not have permission to register a confirmed billing record' },
        { status: 403 },
      );
    }

    const result = db.billingRecords.createManualRegistration(input, MOCK_OPERATOR);
    if (!result.ok) {
      if (result.error === 'outstanding_balance') {
        return NextResponse.json(
          {
            error:
              'Member has an outstanding unpaid balance and cannot be billed until it is resolved',
          },
          { status: 422 },
        );
      }
      if (result.error === 'store_member_mismatch') {
        return NextResponse.json(
          { error: 'member_id does not belong to store_id' },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: 'Invalid contract_id' }, { status: 400 });
    }

    return NextResponse.json(
      {
        id: result.record.id,
        billing_type: result.record.billing_type,
        confirmation_status: result.record.confirmation_status,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/billing-records/manual error:', error);
    return NextResponse.json({ error: 'Failed to register billing record' }, { status: 500 });
  }
}
