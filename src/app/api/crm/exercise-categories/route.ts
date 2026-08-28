import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateExerciseMasterBodySchema,
  CreateExerciseMasterResponseSchema,
  ErrorResponseSchema,
  GetExerciseMasterListQuerySchema,
  GetExerciseMasterListResponseSchema,
} from '@/app/api/_schemas/exercise-master.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/exercise-categories',
  summary: 'List exercise categories',
  description: 'Get exercise categories records',
  tags: ['Exercises'],
  query: GetExerciseMasterListQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetExerciseMasterListResponseSchema,
      description: 'exercise categories list',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/exercise-categories',
  summary: 'Create exercise category',
  description: 'Create a new exercise category record',
  tags: ['Exercises'],
  requestBody: {
    schema: CreateExerciseMasterBodySchema,
    description: 'Create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateExerciseMasterResponseSchema,
      description: 'Created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const queryResult = GetExerciseMasterListQuerySchema.safeParse(queryObj);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(db.exerciseMasters.list('category', queryResult.data), {
      status: 200,
    });
  } catch (error) {
    console.error('GET category exercise master error:', error);
    return NextResponse.json({ error: 'Failed to fetch exercise master list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateExerciseMasterBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const item = db.exerciseMasters.create('category', validationResult.data);
    return NextResponse.json({ message: '参照マスタを登録しました', item }, { status: 201 });
  } catch (error) {
    console.error('POST category exercise master error:', error);
    return NextResponse.json({ error: 'Failed to create exercise master' }, { status: 500 });
  }
}
