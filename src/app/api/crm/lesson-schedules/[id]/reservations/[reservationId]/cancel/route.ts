import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CancelReservationRequestSchema,
  type CancelReservationResponse,
  CancelReservationResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-reservation.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/{scheduleId}/reservations/{reservationId}/cancel',
  summary: 'Cancel reservation',
  description: 'Cancel a reservation',
  tags: ['LessonReservations'],
  parameters: [
    { name: 'scheduleId', in: 'path', required: true, description: 'スケジュールID' },
    { name: 'reservationId', in: 'path', required: true, description: '予約ID' },
  ],
  requestBody: { schema: CancelReservationRequestSchema, description: 'Cancel data' },
  responses: [
    { status: 200, schema: CancelReservationResponseSchema, description: 'Cancelled successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(
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
    const parsed = CancelReservationRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    db.reservations.update(reservationId, {
      status: 'cancelled',
      cancel_type: parsed.data.cancel_type,
      sent_notification: parsed.data.send_notification,
    });

    const response: CancelReservationResponse = {
      id: reservationId,
      status: 'cancelled',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      `POST /crm/lesson-schedules/${scheduleId}/reservations/${reservationId}/cancel error:`,
      error,
    );
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
  }
}
