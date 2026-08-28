import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  IssueConveniencePaymentRequestSchema,
  IssueConveniencePaymentResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/receivables/convenience-payment',
  summary: 'Issue a convenience-store payment link',
  description:
    "Issues a convenience-store payment URL for one line item or a member's full unpaid balance (F-01 FR-008)",
  tags: ['Billing'],
  requestBody: { schema: IssueConveniencePaymentRequestSchema },
  responses: [
    { status: 200, schema: IssueConveniencePaymentResponseSchema, description: 'Issuance result' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Member has no in-scope outstanding records' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function POST(request: NextRequest) {
  try {
    // SalesConvenienceIssue: System/HQ/Manager/Staff — the same set already excluded by the
    // blanket Trainer/Observer rejection below (data-model.md permission table).
    if (MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'You do not have permission to issue convenience-store payments' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = IssueConveniencePaymentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const result = db.billingRecords.issueConveniencePayment(validationResult.data, scope);
    if (!result.ok) {
      return NextResponse.json({ error: 'Member has no outstanding records' }, { status: 404 });
    }

    return NextResponse.json(result.response);
  } catch (error) {
    console.error('POST /crm/billing-records/receivables/convenience-payment error:', error);
    return NextResponse.json(
      { error: 'Failed to issue convenience-store payment' },
      { status: 500 },
    );
  }
}
