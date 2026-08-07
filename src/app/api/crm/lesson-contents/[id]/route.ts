import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetLessonContentDetailResponse,
  GetLessonContentDetailResponseSchema,
} from '@/app/api/_schemas/lesson-content-detail.schema';
import {
  UpdateLessonContentResponseSchema,
  UpdateLessonContentSchema,
} from '@/app/api/_schemas/lesson-content-form.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-contents/{id}',
  summary: 'Get lesson content detail',
  description:
    'Get the full read-only detail for a single lesson content master (studio / body care / personal)',
  tags: ['LessonContents'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Master ID (LSN-* / BDC-* / PLN-*)',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetLessonContentDetailResponseSchema,
      description: 'Lesson content detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Lesson content not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/lesson-contents/{id}',
  summary: 'Update lesson content master',
  description: 'Partially update a lesson content master (studio / bodycare / personal)',
  tags: ['LessonContents'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Master ID (LSN-* / BDC-* / PLN-*)',
    },
  ],
  requestBody: {
    schema: UpdateLessonContentSchema,
    description: 'Lesson content update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateLessonContentResponseSchema,
      description: 'Lesson content updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request - validation error' },
    { status: 404, schema: ErrorResponseSchema, description: 'Lesson content not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const detail = db.lessonContentDetails.getDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const response: GetLessonContentDetailResponse = { data: detail };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching lesson content detail:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson content detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!db.lessonContentDetails.exists(id)) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateLessonContentSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;
    const updated = db.lessonContentDetails.update(id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const response: import('@/app/api/_schemas/lesson-content-form.schema').UpdateLessonContentResponse =
      { message: 'レッスンの変更を保存しました', data: updated };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating lesson content:', error);
    return NextResponse.json({ error: 'Failed to update lesson content' }, { status: 500 });
  }
}
