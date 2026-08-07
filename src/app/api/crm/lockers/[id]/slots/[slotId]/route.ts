import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  UpdateLockerSlotRequestSchema,
  type UpdateLockerSlotResponse,
  UpdateLockerSlotResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/lockers/{id}/slots/{slotId}',
  summary: 'Update locker slot settings',
  description:
    'Update locker slot configuration such as lock type, dimensions, password, and G-02 contract type',
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
    schema: UpdateLockerSlotRequestSchema,
    description: 'Slot settings to update',
  },
  responses: [
    {
      status: 200,
      schema: UpdateLockerSlotResponseSchema,
      description: 'Slot updated successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker or slot not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Slot cannot be updated' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(
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

    const body = await request.json();
    const parsedBody = UpdateLockerSlotRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      const errors = parsedBody.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const currentDetail = db.lockers.getDetailById(id);
    const currentSlot = currentDetail?.slot_items.find((slot) => slot.id === slotId);
    if (!currentSlot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (parsedBody.data.lock_type !== undefined && currentSlot.status === 'in_use') {
      return NextResponse.json(
        { error: 'Cannot change lock type while the slot is in use' },
        { status: 409 },
      );
    }

    const updatedSlot = db.lockers.updateSlot(id, slotId, parsedBody.data);
    if (!updatedSlot) {
      return NextResponse.json({ error: 'Failed to update slot' }, { status: 409 });
    }

    const updatedLocker = db.lockers.getDetailById(id);
    if (!updatedLocker) {
      return NextResponse.json({ error: 'Failed to load updated locker detail' }, { status: 500 });
    }

    const response: UpdateLockerSlotResponse = {
      message: 'スロット設定を更新しました',
      slot: updatedSlot,
      locker: updatedLocker,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating locker slot:', error);
    return NextResponse.json({ error: 'Failed to update locker slot' }, { status: 500 });
  }
}
