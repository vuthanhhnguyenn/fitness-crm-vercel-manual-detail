import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DuplicateRoutineResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/routine.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/routines/{id}/duplicate',
  summary: 'Duplicate routine',
  description: 'Duplicate a routine (basic info + composition) as a new unpublished routine',
  tags: ['Routines'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Source routine ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 201, schema: DuplicateRoutineResponseSchema, description: 'Duplicated' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const duplicated = db.routines.duplicate(id);

    if (!duplicated) {
      return NextResponse.json(
        { error: 'ルーティンが見つかりません', code: 'E-RTN-001' },
        { status: 404 },
      );
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error('POST /crm/routines/[id]/duplicate error:', error);
    return NextResponse.json({ error: 'Failed to duplicate routine' }, { status: 500 });
  }
}
