import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteExerciseMasterBlockedResponseSchema,
  DeleteExerciseMasterResponseSchema,
  ErrorResponseSchema,
  GetExerciseMasterDetailResponseSchema,
  UpdateExerciseMasterBodySchema,
  UpdateExerciseMasterResponseSchema,
} from '@/app/api/_schemas/exercise-master.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const path = '/crm/exercise-tool-types/{id}';
const idParam = {
  name: 'id',
  in: 'path' as const,
  required: true,
  description: 'Exercise master ID',
  schema: { type: 'string' },
};

registerRoute({
  method: 'get',
  path,
  summary: 'Get tool detail',
  description: 'Get a specific tool record',
  tags: ['Exercises'],
  parameters: [idParam],
  responses: [
    { status: 200, schema: GetExerciseMasterDetailResponseSchema, description: 'Detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path,
  summary: 'Update tool',
  description: 'Update a specific tool record',
  tags: ['Exercises'],
  parameters: [idParam],
  requestBody: {
    schema: UpdateExerciseMasterBodySchema,
    description: 'Update payload',
  },
  responses: [
    { status: 200, schema: UpdateExerciseMasterResponseSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path,
  summary: 'Delete tool',
  description: 'Logical delete for tool records',
  tags: ['Exercises'],
  parameters: [idParam],
  responses: [
    { status: 200, schema: DeleteExerciseMasterResponseSchema, description: 'Deleted' },
    { status: 400, schema: DeleteExerciseMasterBlockedResponseSchema, description: 'Blocked' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = db.exerciseMasters.getById('tool', id);
    if (!item) {
      return NextResponse.json({ error: '参照マスタが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error('GET tool master detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch exercise master detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateExerciseMasterBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const item = db.exerciseMasters.update('tool', id, validationResult.data);
    if (!item) {
      return NextResponse.json({ error: '参照マスタが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: '参照マスタを更新しました', item }, { status: 200 });
  } catch (error) {
    console.error('PATCH tool master error:', error);
    return NextResponse.json({ error: 'Failed to update exercise master' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = db.exerciseMasters.delete('tool', id);
    if (!result) {
      return NextResponse.json({ error: '参照マスタが見つかりません' }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          blockReason: result.blockReason,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: '参照マスタを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE tool master error:', error);
    return NextResponse.json({ error: 'Failed to delete exercise master' }, { status: 500 });
  }
}
