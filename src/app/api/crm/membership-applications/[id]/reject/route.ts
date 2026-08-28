import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type RejectRequest,
  RejectRequestSchema,
  RejectResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/reject',
  summary: 'Reject membership application',
  description: 'Reject a membership application',
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
  requestBody: { schema: RejectRequestSchema, description: 'Rejection information' },
  responses: [
    { status: 200, schema: RejectResponseSchema, description: 'Application rejected successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request - invalid request body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Invalid status' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// POST /api/crm/membership-applications/{id}/reject - 否認
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
    const body: unknown = await request.json();
    const validationResult = RejectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const { rejection_reason, rejection_supplement }: RejectRequest = validationResult.data;

    const result = db.membershipApplications.reject(
      id,
      rejection_reason,
      rejection_supplement,
      authResult.user.name,
      allowedStoreIds,
    );

    if (result === 'not_found') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (result === 'invalid_status') {
      return NextResponse.json({ error: 'Application is not pending review' }, { status: 409 });
    }

    return NextResponse.json({ application: result });
  } catch (error) {
    console.error('Error rejecting application:', error);
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }
}
