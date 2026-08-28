import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateExerciseResponseSchema,
  ErrorResponseSchema,
  type GetExercisesQuery,
  GetExercisesQuerySchema,
  GetExercisesResponseSchema,
  UpsertExerciseBodySchema,
} from '@/app/api/_schemas/exercise.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/exercises',
  summary: 'Get exercises',
  description: 'Get paginated exercise list with search, filter, sort, and pagination',
  tags: ['Exercises'],
  query: GetExercisesQuerySchema,
  responses: [
    { status: 200, schema: GetExercisesResponseSchema, description: 'Exercise list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/exercises',
  summary: 'Create exercise',
  description: 'Create a new exercise',
  tags: ['Exercises'],
  requestBody: {
    schema: UpsertExerciseBodySchema,
    description: 'Exercise create payload',
  },
  responses: [
    { status: 201, schema: CreateExerciseResponseSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetExercisesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetExercisesQuery = validationResult.data;
    return NextResponse.json(db.exercises.list(query), { status: 200 });
  } catch (error) {
    console.error('GET /crm/exercises error:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UpsertExerciseBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validationError = db.exercises.validateUpsertBody(validationResult.data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    return NextResponse.json(db.exercises.create(validationResult.data), { status: 201 });
  } catch (error) {
    console.error('POST /crm/exercises error:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
