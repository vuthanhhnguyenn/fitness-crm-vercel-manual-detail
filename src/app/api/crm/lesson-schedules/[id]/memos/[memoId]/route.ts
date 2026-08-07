import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ChangeResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/lesson-schedules/{scheduleId}/memos/{memoId}',
  summary: 'Delete memo',
  description: 'Delete a memo from a lesson schedule',
  tags: ['LessonReservations'],
  parameters: [
    { name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' },
    { name: 'memoId', in: 'path', required: true, description: 'メモID' },
  ],
  responses: [
    { status: 200, schema: ChangeResponseSchema, description: 'Memo deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> },
) {
  const { id: scheduleId, memoId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const deleted = db.reservations.deleteMemo(scheduleId, memoId);
    if (!deleted) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'メモを削除しました' });
  } catch (error) {
    console.error(`DELETE /crm/lesson-schedules/${scheduleId}/memos/${memoId} error:`, error);
    return NextResponse.json({ error: 'Failed to delete memo' }, { status: 500 });
  }
}
