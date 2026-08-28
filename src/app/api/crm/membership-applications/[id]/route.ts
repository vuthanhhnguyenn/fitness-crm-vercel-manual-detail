import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { GetApplicationDetailResponseSchema } from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/membership-applications/{id}',
  summary: 'Get membership application detail',
  description: 'Get detailed information about a specific membership application',
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
  responses: [
    { status: 200, schema: GetApplicationDetailResponseSchema, description: 'Application detail' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// GET /api/crm/membership-applications/{id} - 詳細取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsView])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const { id } = await params;
    // Out-of-scope IDs return 404 rather than 403 so the endpoint never
    // confirms that an application exists in a store outside the caller's scope.
    const detail = db.membershipApplications.getDetail(id, allowedStoreIds);
    if (detail === 'not_found') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application: detail });
  } catch (error) {
    console.error('Error fetching application detail:', error);
    return NextResponse.json({ error: 'Failed to fetch application detail' }, { status: 500 });
  }
}
