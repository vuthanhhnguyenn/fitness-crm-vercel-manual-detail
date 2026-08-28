import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CancelRequestSchema,
  CancelResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/cancel',
  summary: 'Cancel membership application',
  description: 'Cancel a membership application on the applicant behalf',
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
  requestBody: { schema: CancelRequestSchema, description: 'Cancellation information' },
  responses: [
    {
      status: 200,
      schema: CancelResponseSchema,
      description: 'Application cancelled successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request - invalid request body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application not found' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Invalid status, usage start date reached, or same-day limit reached',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// POST /api/crm/membership-applications/{id}/cancel - 取り消し
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    // C-01: 入会取り消し is its own permission, distinct from 承認・否認.
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsCancel])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const { id } = await params;
    const body: unknown = await request.json();
    const validationResult = CancelRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const { cancellation_reason } = validationResult.data;

    const result = db.membershipApplications.cancel(
      id,
      cancellation_reason,
      authResult.user.name,
      allowedStoreIds,
    );

    if (result === 'not_found') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (result === 'invalid_status') {
      return NextResponse.json(
        { error: 'Application cannot be cancelled in its current status' },
        {
          status: 409,
        },
      );
    }
    if (result === 'usage_start_reached') {
      return NextResponse.json(
        { error: '利用開始日を過ぎた申請はキャンセルできません。' },
        { status: 409 },
      );
    }
    if (result === 'same_day_limit') {
      return NextResponse.json({ error: '当日のキャンセル操作は2回までです。' }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling application:', error);
    return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 });
  }
}
