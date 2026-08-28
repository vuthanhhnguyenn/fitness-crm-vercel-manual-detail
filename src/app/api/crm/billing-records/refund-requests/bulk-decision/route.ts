import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import type { RefundApproverRole } from '@/app/api/_schemas/billing.schema';
import {
  BulkRefundDecisionRequestSchema,
  BulkRefundDecisionResponseSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canApproveRefund } from '@/lib/utils/refund-approval';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/refund-requests/bulk-decision',
  summary: 'Approve or reject multiple refund requests',
  description:
    'Ids failing the hierarchical-approval or pending check are excluded from processing rather than failing the whole batch (F-01 FR-018)',
  tags: ['Billing'],
  requestBody: { schema: BulkRefundDecisionRequestSchema },
  responses: [
    { status: 200, schema: BulkRefundDecisionResponseSchema, description: 'Bulk decision result' },
    { status: 400, description: 'Validation failure, or zero ids are decidable' },
    { status: 403, description: 'Forbidden' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const callerRole = authResult.user.role.toLowerCase() as StaffRole;

    // SalesRefundApprove: System/Headquarter/Manager only (data-model.md permission table);
    // per-id hierarchical authority is enforced by canApproveRefund inside decideBulkRefundRequests.
    if (callerRole === 'staff' || callerRole === 'trainer' || callerRole === 'observer') {
      return NextResponse.json(
        { error: 'You do not have permission to approve refund requests' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = BulkRefundDecisionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(callerRole, {});
    const { ids, decision } = validationResult.data;
    const result = db.billingRecords.decideBulkRefundRequests(
      ids,
      decision,
      {
        id: authResult.user.id,
        name: authResult.user.name,
        role: callerRole as RefundApproverRole,
      },
      (requesterRole) => canApproveRefund(callerRole, requesterRole),
      scope,
    );

    if (result.decided_ids.length === 0) {
      return NextResponse.json(
        { error: 'No refund requests in this selection can be decided by your role' },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /crm/billing-records/refund-requests/bulk-decision error:', error);
    return NextResponse.json({ error: 'Failed to decide refund requests' }, { status: 500 });
  }
}
