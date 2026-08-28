import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetLockerContractsQuery,
  GetLockerContractsQuerySchema,
  type GetLockerContractsResponse,
  GetLockerContractsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockerContracts } from '../_utils/locker-query.util';

registerRoute({
  method: 'get',
  path: '/crm/lockers/contracts',
  summary: 'Get locker contract list',
  description: 'Get paginated list of locker contracts with filtering and sorting',
  tags: ['Lockers'],
  query: GetLockerContractsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetLockerContractsResponseSchema,
      description: 'List of locker contracts',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetLockerContractsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetLockerContractsQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      contract_type,
      status,
      sort_by = 'contract_id',
      sort_order = 'asc',
    } = query;

    const allContracts = db.lockerContracts.getList();
    const filtered = filterLockerContracts(allContracts, {
      search,
      contract_type,
      status,
      sort_by,
      sort_order,
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;

    const response: GetLockerContractsResponse = {
      contracts: filtered.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        total_pages,
        all_total: allContracts.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching locker contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch locker contracts' }, { status: 500 });
  }
}
