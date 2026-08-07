import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  SendLockerSlotReminderRequestSchema,
  type SendLockerSlotReminderResponse,
  SendLockerSlotReminderResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/lockers/{id}/slots/{slotId}/reminder-notifications',
  summary: 'Send locker slot reminder notifications',
  description: 'Send forgetfulness reminder notifications for a pending-release locker slot',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker internal id',
    },
    {
      name: 'slotId',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker slot internal id',
    },
  ],
  requestBody: {
    schema: SendLockerSlotReminderRequestSchema,
    description: 'Reminder notification options',
  },
  responses: [
    {
      status: 200,
      schema: SendLockerSlotReminderResponseSchema,
      description: 'Reminder notifications sent successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker or slot not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Slot is not pending release' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id, slotId } = await params;
    const locker = db.lockers.getById(id);
    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsedBody = SendLockerSlotReminderRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      const errors = parsedBody.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const currentDetail = db.lockers.getDetailById(id);
    const currentSlot = currentDetail?.slot_items.find((slot) => slot.id === slotId);
    if (!currentSlot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (currentSlot.status !== 'pending_release' || !currentSlot.cancel_date) {
      return NextResponse.json(
        { error: 'Reminder notifications can only be sent for pending-release slots' },
        { status: 409 },
      );
    }

    const notifications = db.lockers.sendSlotReminder(id, slotId, parsedBody.data.reminder_days);
    if (!notifications) {
      return NextResponse.json({ error: 'Failed to send reminder notifications' }, { status: 500 });
    }

    const updatedSlot = db.lockers.getDetailById(id)?.slot_items.find((slot) => slot.id === slotId);
    if (!updatedSlot) {
      return NextResponse.json({ error: 'Failed to load updated slot' }, { status: 500 });
    }

    const response: SendLockerSlotReminderResponse = {
      message: 'リマインド通知を送信しました',
      notifications,
      slot: updatedSlot,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error sending locker slot reminder:', error);
    return NextResponse.json({ error: 'Failed to send locker slot reminder' }, { status: 500 });
  }
}
