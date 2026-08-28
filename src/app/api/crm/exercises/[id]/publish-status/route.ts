import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  UpdateExercisePublishStatusBodySchema,
  UpdateExercisePublishStatusResponseSchema,
} from '@/app/api/_schemas/exercise.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/exercises/{id}/publish-status',
  summary: 'Update exercise publish status',
  description: 'Update exercise publish/private status by ID',
  tags: ['Exercises'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Exercise ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateExercisePublishStatusBodySchema,
    description: 'Publish status payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateExercisePublishStatusResponseSchema,
      description: 'Publish status updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateExercisePublishStatusBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.exercises.updatePublishStatus(id, validationResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'エクササイズが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('POST /crm/exercises/[id]/publish-status error:', error);
    return NextResponse.json({ error: 'Failed to update publish status' }, { status: 500 });
  }
}
