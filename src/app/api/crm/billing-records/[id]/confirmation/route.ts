import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BillingRecordSchema,
  ToggleConfirmationRequestSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'patch',
  path: '/crm/billing-records/{id}/confirmation',
  summary: 'Toggle a single billing record confirmation status',
  description: 'Confirm or unconfirm one billing record (F-01 FR-012)',
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
  requestBody: { schema: ToggleConfirmationRequestSchema },
  responses: [
    { status: 200, schema: BillingRecordSchema, description: 'Updated billing record' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record not found' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';
const MOCK_STAFF_ID: string | undefined = undefined;

function hasDelegatedConfirmPermission(): boolean {
  if (MOCK_ROLE !== 'staff' || !MOCK_STAFF_ID) return false;
  return db.staff_permissions
    .getByStaffId(MOCK_STAFF_ID)
    .some((p) => p.permission_code === 'F-01.confirm');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (
      !canPerformSalesAction(MOCK_ROLE, 'confirm', {
        hasDelegatedConfirmPermission: hasDelegatedConfirmPermission(),
      })
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to change confirmation status' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = ToggleConfirmationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const updated = db.billingRecords.toggleConfirmation(
      id,
      validationResult.data.status,
      MOCK_OPERATOR,
      scope,
    );
    if (!updated) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /crm/billing-records/[id]/confirmation error:', error);
    return NextResponse.json({ error: 'Failed to update confirmation status' }, { status: 500 });
  }
}
