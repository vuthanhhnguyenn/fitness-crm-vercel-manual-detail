import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type ExportLockersRequest,
  ExportLockersRequestSchema,
  type ExportLockersResponse,
  ExportLockersResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockers } from '../_utils/locker-query.util';

registerRoute({
  method: 'post',
  path: '/crm/lockers/export',
  summary: 'Export locker list',
  description:
    'Export locker list data using the same filters and sort as the list screen without pagination',
  tags: ['Lockers'],
  requestBody: {
    schema: ExportLockersRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    {
      status: 200,
      schema: ExportLockersResponseSchema,
      description: 'Locker list export data',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = ExportLockersRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const exportRequest: ExportLockersRequest = validationResult.data;
    const filtered = filterLockers(db.lockers.getList(), exportRequest);

    const response: ExportLockersResponse = { lockers: filtered };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting lockers:', error);
    return NextResponse.json({ error: 'Failed to export lockers' }, { status: 500 });
  }
}
