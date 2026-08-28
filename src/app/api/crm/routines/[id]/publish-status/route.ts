import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  UpdateRoutinePublishStatusBodySchema,
  UpdateRoutinePublishStatusResponseSchema,
} from '@/app/api/_schemas/routine.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/routines/{id}/publish-status',
  summary: 'Update routine publish status',
  description: 'Publish or unpublish a routine (publish requires >= 1 exercise)',
  tags: ['Routines'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Routine ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateRoutinePublishStatusBodySchema,
    description: 'Publish status payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateRoutinePublishStatusResponseSchema,
      description: 'Publish status updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 422, schema: ErrorResponseSchema, description: 'Publish blocked (no exercises)' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateRoutinePublishStatusBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.routines.updatePublishStatus(id, validationResult.data);

    if (!result) {
      return NextResponse.json(
        { error: 'ルーティンが見つかりません', code: 'E-RTN-001' },
        { status: 404 },
      );
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 422 });
    }

    return NextResponse.json(result.response, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/routines/[id]/publish-status error:', error);
    return NextResponse.json({ error: 'Failed to update publish status' }, { status: 500 });
  }
}
