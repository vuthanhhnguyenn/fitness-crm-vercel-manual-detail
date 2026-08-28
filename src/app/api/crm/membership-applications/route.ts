import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetMembershipApplicationsQuery,
  GetMembershipApplicationsQuerySchema,
  GetMembershipApplicationsResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for GET route
registerRoute({
  method: 'get',
  path: '/crm/membership-applications',
  summary: 'Get membership applications list',
  description: 'Get paginated list of membership applications with filtering and sorting',
  tags: ['Membership Applications'],
  query: GetMembershipApplicationsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetMembershipApplicationsResponseSchema,
      description: 'List of membership applications',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// GET /api/crm/membership-applications - 一覧取得
export async function GET(request: NextRequest) {
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

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetMembershipApplicationsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetMembershipApplicationsQuery = validationResult.data;

    // Client-supplied brand/store params may only narrow within scope, never widen it.
    const scopedQuery: GetMembershipApplicationsQuery = {
      ...query,
      store: allowedStoreIds !== null && allowedStoreIds.length === 1 ? undefined : query.store,
    };

    const response = db.membershipApplications.list(scopedQuery, allowedStoreIds);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching membership applications:', error);
    return NextResponse.json({ error: 'Failed to fetch membership applications' }, { status: 500 });
  }
}
