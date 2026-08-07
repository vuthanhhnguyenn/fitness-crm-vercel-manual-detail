import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateMemoRequestSchema,
  ErrorResponseSchema,
  type MemoListResponse,
  MemoListResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/{scheduleId}/memos',
  summary: 'List memos',
  description: 'Get all memos for a lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  responses: [
    { status: 200, schema: MemoListResponseSchema, description: 'Memo list' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/{scheduleId}/memos',
  summary: 'Create memo',
  description: 'Create a new memo for the lesson schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: CreateMemoRequestSchema, description: 'Memo content' },
  responses: [
    { status: 201, schema: MemoListResponseSchema, description: 'Memo created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const memos = db.reservations.getMemos(scheduleId);
    const response: MemoListResponse = { memos };
    return NextResponse.json(response);
  } catch (error) {
    console.error(`GET /crm/lesson-schedules/${scheduleId}/memos error:`, error);
    return NextResponse.json({ error: 'Failed to fetch memos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  try {
    const existing = db.lessonSchedules.getById(scheduleId);
    if (!existing) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CreateMemoRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const memo = db.reservations.createMemo(scheduleId, parsed.data);
    return NextResponse.json(memo, { status: 201 });
  } catch (error) {
    console.error(`POST /crm/lesson-schedules/${scheduleId}/memos error:`, error);
    return NextResponse.json({ error: 'Failed to create memo' }, { status: 500 });
  }
}
