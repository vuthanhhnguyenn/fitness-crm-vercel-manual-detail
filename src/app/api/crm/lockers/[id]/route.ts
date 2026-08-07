import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  DeleteLockerResponseSchema,
  ErrorResponseSchema,
  type GetLockerDetailResponse,
  GetLockerDetailResponseSchema,
  UpdateLockerRequestSchema,
  type UpdateLockerResponse,
  UpdateLockerResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/{id}',
  summary: 'Get locker detail',
  description:
    'Get detailed information for a specific locker including associated contracts and pending slots',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker internal id',
    },
  ],
  responses: [
    { status: 200, schema: GetLockerDetailResponseSchema, description: 'Locker detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/lockers/{id}',
  summary: 'Update locker',
  description: 'Update locker settings (shape cannot be changed)',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker internal id',
    },
  ],
  requestBody: {
    schema: UpdateLockerRequestSchema,
    description: 'Locker update payload',
  },
  responses: [
    { status: 200, schema: UpdateLockerResponseSchema, description: 'Locker updated successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Location symbol conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/lockers/{id}',
  summary: 'Delete locker',
  description: 'Delete a locker when it has no in-use or pending-release slots',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker internal id',
    },
  ],
  responses: [
    { status: 200, schema: DeleteLockerResponseSchema, description: 'Locker deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Locker has active slots' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const locker = db.lockers.getDetailById(id);
    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }

    const response: GetLockerDetailResponse = { locker };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching locker detail:', error);
    return NextResponse.json({ error: 'Failed to fetch locker detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateLockerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    try {
      const locker = db.lockers.update(id, validationResult.data);
      if (!locker) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }

      const response: UpdateLockerResponse = {
        message: 'ロッカー情報を更新しました',
        locker,
      };
      return NextResponse.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update locker';
      if (message.includes('Location symbol')) {
        return NextResponse.json({ error: '同一店舗内で既に使用されています' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating locker:', error);
    return NextResponse.json({ error: 'Failed to update locker' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const locker = db.lockers.getDetailById(id);

    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }

    if (locker.has_active_slots) {
      return NextResponse.json(
        { error: 'Cannot delete locker with active or pending slots' },
        { status: 409 },
      );
    }

    const deleted = db.lockers.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete locker' }, { status: 500 });
    }

    return NextResponse.json({ message: 'ロッカーを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting locker:', error);
    return NextResponse.json({ error: 'Failed to delete locker' }, { status: 500 });
  }
}
