import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetLessonContentHistoryResponse,
  GetLessonContentHistoryResponseSchema,
} from '@/app/api/_schemas/lesson-content-detail.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-contents/{id}/history',
  summary: 'Get lesson content change history',
  description: 'Get the change-log entries for a lesson content master (newest-first)',
  tags: ['LessonContents'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Master ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetLessonContentHistoryResponseSchema,
      description: 'Lesson content change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Lesson content not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!db.lessonContentDetails.exists(id)) {
      return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
    }

    const response: GetLessonContentHistoryResponse = {
      data: db.lessonContentHistory.getByMasterId(id),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching lesson history:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson history' }, { status: 500 });
  }
}
