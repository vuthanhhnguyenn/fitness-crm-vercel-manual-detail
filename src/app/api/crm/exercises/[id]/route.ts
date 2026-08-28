import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteExerciseBlockedResponseSchema,
  DeleteExerciseResponseSchema,
  ErrorResponseSchema,
  GetExerciseDetailResponseSchema,
  UpdateExerciseResponseSchema,
  UpsertExerciseBodySchema,
} from '@/app/api/_schemas/exercise.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const pathParams = [
  {
    name: 'id',
    in: 'path' as const,
    required: true,
    description: 'Exercise ID',
    schema: { type: 'string' },
  },
];

registerRoute({
  method: 'get',
  path: '/crm/exercises/{id}',
  summary: 'Get exercise detail',
  description: 'Get exercise detail by ID',
  tags: ['Exercises'],
  parameters: pathParams,
  responses: [
    { status: 200, schema: GetExerciseDetailResponseSchema, description: 'Exercise detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/exercises/{id}',
  summary: 'Update exercise',
  description: 'Update exercise by ID',
  tags: ['Exercises'],
  parameters: pathParams,
  requestBody: {
    schema: UpsertExerciseBodySchema,
    description: 'Exercise update payload',
  },
  responses: [
    { status: 200, schema: UpdateExerciseResponseSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/exercises/{id}',
  summary: 'Delete exercise',
  description: 'Logical delete for exercise',
  tags: ['Exercises'],
  parameters: pathParams,
  responses: [
    { status: 200, schema: DeleteExerciseResponseSchema, description: 'Deleted' },
    { status: 400, schema: DeleteExerciseBlockedResponseSchema, description: 'Delete blocked' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exercise = db.exercises.getById(id);

    if (!exercise) {
      return NextResponse.json({ error: 'エクササイズが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ exercise }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/exercises/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch exercise detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const updated = db.exercises.update(id, validationResult.data);

    if (!updated) {
      return NextResponse.json({ error: 'エクササイズが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/exercises/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = db.exercises.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'エクササイズが見つかりません' }, { status: 404 });
    }

    if (!deleted.ok) {
      return NextResponse.json(
        { error: deleted.error, blockReason: deleted.blockReason },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: 'エクササイズを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/exercises/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
