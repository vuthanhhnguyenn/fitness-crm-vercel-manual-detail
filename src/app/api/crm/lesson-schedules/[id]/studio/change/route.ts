import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type ChangeResponse,
  ChangeResponseSchema,
  ChangeStudioRequestSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const STUDIO_ID_TO_NAME: Record<string, string> = {
  STD001: 'Zumbaスタジオ',
  STD002: 'スタジオA',
  STD003: 'スタジオB',
  STD004: 'ホットヨガスタジオA',
  STD005: 'メインスタジオ',
  STD006: 'PTルーム1',
  STD007: 'PTルーム2',
};

registerRoute({
  method: 'patch',
  path: '/crm/lesson-schedules/{scheduleId}/studio/change',
  summary: 'Change studio',
  description: 'Change the studio for a lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: ChangeStudioRequestSchema, description: 'Studio change data' },
  responses: [
    { status: 200, schema: ChangeResponseSchema, description: 'Changed successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ChangeStudioRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    db.lessonSchedules.update(scheduleId, {
      studio_name: STUDIO_ID_TO_NAME[parsed.data.studio_id] ?? parsed.data.studio_id,
    });

    const response: ChangeResponse = { message: 'スタジオを変更しました' };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`PATCH /crm/lesson-schedules/${scheduleId}/studio/change error:`, error);
    return NextResponse.json({ error: 'Failed to change studio' }, { status: 500 });
  }
}
