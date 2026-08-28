import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreatePositionBodySchema,
  CreatePositionResponseSchema,
  type GetPositionsQuery,
  GetPositionsQuerySchema,
  GetPositionsResponseSchema,
} from '@/app/api/_schemas/position.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/positions',
  summary: 'List positions',
  description:
    'Paginated position master (職位マスター) list with name search, reverse permission filter, and role filter (Y-01 FR-006)',
  tags: ['Positions'],
  query: GetPositionsQuerySchema,
  responses: [
    { status: 200, schema: GetPositionsResponseSchema, description: 'Position list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/positions',
  summary: 'Create position master',
  description:
    'Creates a position master (Y-01 FR-006). (role, name) must be unique; omitted permission keys default to false',
  tags: ['Positions'],
  requestBody: {
    schema: CreatePositionBodySchema,
    description: 'Position create payload',
  },
  responses: [
    { status: 201, schema: CreatePositionResponseSchema, description: 'Position created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 409, schema: ErrorResponseSchema, description: 'Duplicate (role, name)' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetPositionsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetPositionsQuery = validationResult.data;
    return NextResponse.json(db.positions.list(query), { status: 200 });
  } catch (error) {
    console.error('GET /crm/positions error:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreatePositionBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.positions.create(validationResult.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('POST /crm/positions error:', error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }
}
