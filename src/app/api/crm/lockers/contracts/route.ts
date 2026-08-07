import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CreateLockerContractRequestSchema,
  type CreateLockerContractResponse,
  CreateLockerContractResponseSchema,
  ErrorResponseSchema,
  type GetLockerContractsQuery,
  GetLockerContractsQuerySchema,
  type GetLockerContractsResponse,
  GetLockerContractsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockerContracts } from '../_utils/locker-query.util';

registerRoute({
  method: 'post',
  path: '/crm/lockers/contracts',
  summary: 'Create locker contract',
  description: 'Create a new locker contract for a member',
  tags: ['Lockers'],
  requestBody: {
    schema: CreateLockerContractRequestSchema,
    description: 'Locker contract create payload',
  },
  responses: [
    {
      status: 200,
      schema: CreateLockerContractResponseSchema,
      description: 'Locker contract created successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

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

    const filtered = filterLockerContracts(db.lockerContracts.getList(), {
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
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching locker contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch locker contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = CreateLockerContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lockerContracts.create(validationResult.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const response: CreateLockerContractResponse = {
      message: 'ロッカー契約を登録しました',
      contract: result.contract,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('POST /crm/lockers/contracts error:', error);
    return NextResponse.json({ error: 'Failed to create locker contract' }, { status: 500 });
  }
}
