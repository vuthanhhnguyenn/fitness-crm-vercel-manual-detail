import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  UpdateLessonContentStatusRequestSchema,
  UpdateLessonContentStatusResponseSchema,
} from '@/app/api/_schemas/lesson-content-detail.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/lesson-contents/{id}/status',
  summary: 'Update lesson content status',
  description:
    'Activate / deactivate a lesson content master (studio / body care / personal); records a change-history entry with the reason',
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
    schema: UpdateLessonContentStatusRequestSchema,
    description: 'レッスンステータス更新（有効化/無効化）リクエスト',
  },
  responses: [
    {
      status: 200,
      schema: UpdateLessonContentStatusResponseSchema,
      description: 'Lesson content status updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request - validation error' },
    { status: 404, schema: ErrorResponseSchema, description: 'Lesson content not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!db.lessonContentDetails.exists(id)) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateLessonContentStatusRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { status, reason } = validationResult.data;
    const updated = db.lessonContentDetails.updateStatus(id, status, reason);
    if (!updated) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const message = status === 'inactive' ? 'レッスンを無効化しました' : 'レッスンを有効化しました';
    return NextResponse.json({ message, data: updated });
  } catch (error) {
    console.error('Error updating lesson content status:', error);
    return NextResponse.json({ error: 'Failed to update lesson content status' }, { status: 500 });
  }
}
