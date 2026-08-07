import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ReservationSchema,
  UpdateAttendanceRequestSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/lesson-schedules/{scheduleId}/reservations/{reservationId}/attendance',
  summary: 'Update attendance status',
  description: 'Update the attendance status of a reservation',
  tags: ['LessonReservations'],
  parameters: [
    { name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' },
    { name: 'reservationId', in: 'path', required: true, description: '予約ID' },
  ],
  requestBody: { schema: UpdateAttendanceRequestSchema, description: 'Attendance data' },
  responses: [
    { status: 200, schema: ReservationSchema, description: 'Attendance updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> },
) {
  const { id: scheduleId, reservationId } = await params;
  try {
    const schedule = db.lessonSchedules.getById(scheduleId);
    if (!schedule) {
      return NextResponse.json({ error: 'Lesson schedule not found' }, { status: 404 });
    }

    const reservation = db.reservations.getById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateAttendanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.reservations.update(reservationId, {
      attendance_status: parsed.data.attendance_status,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      `PATCH /crm/lesson-schedules/${scheduleId}/reservations/${reservationId}/attendance error:`,
      error,
    );
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
