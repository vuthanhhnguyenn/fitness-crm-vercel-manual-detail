import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetEnrollmentFeeMastersQuerySchema,
  GetEnrollmentFeeMastersResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/membership-applications/enrollment-fee-masters',
  summary: 'Get enrollment fee masters',
  tags: ['Membership Applications'],
  query: GetEnrollmentFeeMastersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetEnrollmentFeeMastersResponseSchema,
      description: 'List of enrollment fee masters',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
  ],
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryObj: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  const result = GetEnrollmentFeeMastersQuerySchema.safeParse(queryObj);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const { brand, applicationType } = result.data;
  const items = db.enrollmentFeeMasters.getFiltered(brand, applicationType);

  return NextResponse.json({ items }, { status: 200 });
}
