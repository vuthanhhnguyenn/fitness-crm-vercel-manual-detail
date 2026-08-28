import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import type { RefundApproverRole } from '@/app/api/_schemas/billing.schema';
import {
  RefundDecisionRequestSchema,
  RefundQueueEntrySchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canApproveRefund, requiredApproverLabel } from '@/lib/utils/refund-approval';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/refund-requests/{id}/decision',
  summary: 'Approve or reject a single refund request',
  description:
    'Approve executes the refund immediately (status → completed, never left at approved, F-01 FR-017); requires SalesRefundApprove and canApproveRefund (FR-016)',
  tags: ['Billing'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Refund request ID',
    },
  ],
  requestBody: { schema: RefundDecisionRequestSchema },
  responses: [
    { status: 200, schema: RefundQueueEntrySchema, description: 'Updated refund queue entry' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden — no refund-approval authority for this request' },
    { status: 404, description: 'Refund request not found' },
    { status: 409, description: 'Refund request is not pending' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const callerRole = authResult.user.role.toLowerCase() as StaffRole;

    // SalesRefundApprove: System/Headquarter/Manager only — Staff never approves refunds
    // (data-model.md permission table); the fine-grained hierarchical check comes next.
    if (callerRole === 'staff' || callerRole === 'trainer' || callerRole === 'observer') {
      return NextResponse.json(
        { error: 'You do not have permission to approve refund requests' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = RefundDecisionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(callerRole, {});
    const result = db.billingRecords.decideRefundRequest(
      id,
      validationResult.data.decision,
      {
        id: authResult.user.id,
        name: authResult.user.name,
        role: callerRole as RefundApproverRole,
      },
      (requesterRole) => canApproveRefund(callerRole, requesterRole),
      scope,
    );

    if (!result.ok) {
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
      }
      if (result.error === 'not_pending') {
        return NextResponse.json({ error: 'refund request is not pending' }, { status: 409 });
      }
      return NextResponse.json(
        {
          error: `${result.requesterRole}の申請には${requiredApproverLabel(result.requesterRole!)}が必要です`,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(result.entry);
  } catch (error) {
    console.error('POST /crm/billing-records/refund-requests/[id]/decision error:', error);
    return NextResponse.json({ error: 'Failed to decide refund request' }, { status: 500 });
  }
}
