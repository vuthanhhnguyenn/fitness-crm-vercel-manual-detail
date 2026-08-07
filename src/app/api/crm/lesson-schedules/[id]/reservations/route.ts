import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  AddReservationRequestSchema,
  ErrorResponseSchema,
  ReservationListResponseSchema,
  ReservationsQuerySchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/{scheduleId}/reservations',
  summary: 'List reservations',
  description: 'Get reservation list with pagination and sorting',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  query: ReservationsQuerySchema,
  responses: [
    { status: 200, schema: ReservationListResponseSchema, description: 'Reservation list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/{scheduleId}/reservations',
  summary: 'Add reservation',
  description: 'Add a new reservation to the schedule',
  tags: ['LessonReservations'],
  parameters: [{ name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' }],
  requestBody: { schema: AddReservationRequestSchema, description: 'Reservation data' },
  responses: [
    { status: 201, schema: ReservationListResponseSchema, description: 'Reservation created' },
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

    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const parsed = ReservationsQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = db.reservations.getByScheduleId(scheduleId, parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /crm/lesson-schedules/${scheduleId}/reservations error:`, error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
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
    const parsed = AddReservationRequestSchema.safeParse({ ...body, schedule_id: scheduleId });
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const reservation = db.reservations.create(parsed.data);
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error(`POST /crm/lesson-schedules/${scheduleId}/reservations error:`, error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}
