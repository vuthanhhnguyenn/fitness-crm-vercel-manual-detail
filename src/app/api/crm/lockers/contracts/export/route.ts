import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type ExportLockerContractsRequest,
  ExportLockerContractsRequestSchema,
  type ExportLockerContractsResponse,
  ExportLockerContractsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockerContracts } from '../../_utils/locker-query.util';

registerRoute({
  method: 'post',
  path: '/crm/lockers/contracts/export',
  summary: 'Export locker contract list',
  description:
    'Export locker contract list data using the same filters and sort as the list screen without pagination',
  tags: ['Lockers'],
  requestBody: {
    schema: ExportLockerContractsRequestSchema,
    description: 'Export filters and sort',
  },
  responses: [
    {
      status: 200,
      schema: ExportLockerContractsResponseSchema,
      description: 'Locker contract list export data',
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
    const validationResult = ExportLockerContractsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const exportRequest: ExportLockerContractsRequest = validationResult.data;
    const filtered = filterLockerContracts(db.lockerContracts.getList(), exportRequest);

    const response: ExportLockerContractsResponse = { contracts: filtered };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting locker contracts:', error);
    return NextResponse.json({ error: 'Failed to export locker contracts' }, { status: 500 });
  }
}
