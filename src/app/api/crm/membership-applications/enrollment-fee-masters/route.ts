import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetEnrollmentFeeMastersQuerySchema,
  GetEnrollmentFeeMastersResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

registerRoute({
  method: 'get',
  path: '/crm/membership-applications/enrollment-fee-masters',
  summary: 'Get enrollment fee masters',
  description: 'Active enrollment fee masters for a brand (JOYFIT only)',
  tags: ['Membership Applications'],
  query: GetEnrollmentFeeMastersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetEnrollmentFeeMastersResponseSchema,
      description: 'Active fee masters',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
  ],
});

export async function GET(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (
    !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsCreate])
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const queryObj: Record<string, string | undefined> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  const result = GetEnrollmentFeeMastersQuerySchema.safeParse(queryObj);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const { brand_id } = result.data;
  // Fee masters key on the brand display name ('FIT365' | 'JOYFIT') — the same
  // vocabulary the admin form's brand select and the application rows use.
  // The admin direct-enrollment form only offers normal-enrollment fees —
  // corporate/employee-discount/special-contract masters are out of scope here.
  const masters = db.enrollmentFeeMasters.getFiltered(brand_id, 'normal').map((m) => ({
    id: m.id,
    name: m.name,
    amount: m.amount,
    brand_id: m.brand,
    is_active: m.isActive,
  }));

  return NextResponse.json({ masters }, { status: 200 });
}
