import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateRoutineResponseSchema,
  ErrorResponseSchema,
  type GetRoutinesQuery,
  GetRoutinesQuerySchema,
  GetRoutinesResponseSchema,
  UpsertRoutineBodySchema,
} from '@/app/api/_schemas/routine.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/routines',
  summary: 'Get routines',
  description: 'Get paginated routine list with search, filter, sort, and pagination',
  tags: ['Routines'],
  query: GetRoutinesQuerySchema,
  responses: [
    { status: 200, schema: GetRoutinesResponseSchema, description: 'Routine list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/routines',
  summary: 'Create routine',
  description: 'Create a new routine (always unpublished)',
  tags: ['Routines'],
  requestBody: {
    schema: UpsertRoutineBodySchema,
    description: 'Routine create payload',
  },
  responses: [
    { status: 201, schema: CreateRoutineResponseSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 422, schema: ErrorResponseSchema, description: 'Unprocessable entity' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetRoutinesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetRoutinesQuery = validationResult.data;
    return NextResponse.json(db.routines.list(query), { status: 200 });
  } catch (error) {
    console.error('GET /crm/routines error:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UpsertRoutineBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validationError = db.routines.validateUpsertBody(validationResult.data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error, code: validationError.code },
        { status: validationError.status },
      );
    }

    return NextResponse.json(db.routines.create(validationResult.data), { status: 201 });
  } catch (error) {
    console.error('POST /crm/routines error:', error);
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}
