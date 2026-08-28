import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteRoutineResponseSchema,
  ErrorResponseSchema,
  GetRoutineDetailResponseSchema,
  UpdateRoutineResponseSchema,
  UpsertRoutineBodySchema,
} from '@/app/api/_schemas/routine.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const pathParams = [
  {
    name: 'id',
    in: 'path' as const,
    required: true,
    description: 'Routine ID',
    schema: { type: 'string' },
  },
];

registerRoute({
  method: 'get',
  path: '/crm/routines/{id}',
  summary: 'Get routine detail',
  description: 'Get routine detail by ID (basic info + exercises + sets)',
  tags: ['Routines'],
  parameters: pathParams,
  responses: [
    { status: 200, schema: GetRoutineDetailResponseSchema, description: 'Routine detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/routines/{id}',
  summary: 'Update routine',
  description: 'Update routine basic info + exercises + sets by ID',
  tags: ['Routines'],
  parameters: pathParams,
  requestBody: {
    schema: UpsertRoutineBodySchema,
    description: 'Routine update payload',
  },
  responses: [
    { status: 200, schema: UpdateRoutineResponseSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 422, schema: ErrorResponseSchema, description: 'Unprocessable entity' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/routines/{id}',
  summary: 'Delete routine',
  description: 'Logical delete for routine (blocked while published)',
  tags: ['Routines'],
  parameters: pathParams,
  responses: [
    { status: 200, schema: DeleteRoutineResponseSchema, description: 'Deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Delete blocked (published)' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const routine = db.routines.getById(id);

    if (!routine) {
      return NextResponse.json(
        { error: 'ルーティンが見つかりません', code: 'E-RTN-001' },
        { status: 404 },
      );
    }

    return NextResponse.json({ routine }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/routines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch routine detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const updated = db.routines.update(id, validationResult.data);
    if (!updated) {
      return NextResponse.json(
        { error: 'ルーティンが見つかりません', code: 'E-RTN-001' },
        { status: 404 },
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/routines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = db.routines.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'ルーティンが見つかりません', code: 'E-RTN-001' },
        { status: 404 },
      );
    }

    if (!deleted.ok) {
      return NextResponse.json({ error: deleted.error, code: deleted.code }, { status: 409 });
    }

    return NextResponse.json({ message: 'ルーティンを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/routines/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
