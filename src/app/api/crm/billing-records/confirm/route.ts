import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ConfirmBillingRecordsRequestSchema,
  ConfirmBillingRecordsResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'patch',
  path: '/crm/billing-records/confirm',
  summary: 'Bulk confirm billing records',
  description:
    'Confirm every currently-unconfirmed record in the selection; already-confirmed rows are skipped silently (F-01 FR-012)',
  tags: ['Billing'],
  requestBody: { schema: ConfirmBillingRecordsRequestSchema },
  responses: [
    { status: 200, schema: ConfirmBillingRecordsResponseSchema, description: 'Confirm result' },
    { status: 400, description: 'No unconfirmed records selected' },
    { status: 403, description: 'Forbidden' },
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

export async function PATCH(request: NextRequest) {
  try {
    if (
      !canPerformSalesAction(MOCK_ROLE, 'confirm', {
        hasDelegatedConfirmPermission: hasDelegatedConfirmPermission(),
      })
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to confirm billing records' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = ConfirmBillingRecordsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    if (validationResult.data.ids.length === 0) {
      return NextResponse.json({ error: 'No unconfirmed records selected' }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.confirmMany(validationResult.data.ids, MOCK_OPERATOR, scope);

    if (result.confirmed_ids.length === 0) {
      return NextResponse.json({ error: 'No unconfirmed records selected' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH /crm/billing-records/confirm error:', error);
    return NextResponse.json({ error: 'Failed to confirm billing records' }, { status: 500 });
  }
}
