import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ApproveRequestSchema,
  ApproveResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/approve',
  summary: 'Approve membership application',
  description: 'Manually approve a membership application',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: ApproveRequestSchema,
    description: 'Approval information (all fields optional)',
  },
  responses: [
    {
      status: 200,
      schema: ApproveResponseSchema,
      description: 'Application approved successfully',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application not found' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Invalid status, or agreement timestamp missing',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// POST /api/crm/membership-applications/{id}/approve - 手動承認
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsApprove])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const { id } = await params;
    const rawBody: unknown = await request.json().catch(() => ({}));
    const { staff_exemption_reason } = ApproveRequestSchema.parse(rawBody ?? {});
    const result = db.membershipApplications.approve(
      id,
      authResult.user.name,
      allowedStoreIds,
      staff_exemption_reason,
    );

    if (result === 'not_found') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (result === 'invalid_status') {
      return NextResponse.json({ error: 'Application is not pending review' }, { status: 409 });
    }
    if (result === 'agreement_missing') {
      return NextResponse.json(
        { error: '代理申請の合意日時が未入力のため承認できません。' },
        { status: 409 },
      );
    }

    // The application is approved — create the member and contract record unless
    // one already exists (idempotent under retry).
    const existingContract = db.contracts.getByApplicationId(id);
    if (!existingContract) {
      const member = db.members.createFromApplication(result);
      db.contracts.createFromApprovedApplication({
        application: result,
        member_id: member.memberId,
      });
    }

    return NextResponse.json({ application: result });
  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
