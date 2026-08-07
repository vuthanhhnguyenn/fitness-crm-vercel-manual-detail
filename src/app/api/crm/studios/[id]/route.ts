import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetStudioDetailResponseSchema } from '@/app/api/_schemas/studio-detail.schema';
import {
  UpdateStudioPayloadSchema,
  UpdateStudioResponseSchema,
} from '@/app/api/_schemas/studio.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';

registerRoute({
  method: 'get',
  path: '/crm/studios/{id}',
  summary: 'Get studio detail',
  description:
    'Get complete studio detail information including linked lessons, images, layout, and utilization',
  tags: ['Studios'],
  responses: [
    {
      status: 200,
      schema: GetStudioDetailResponseSchema,
      description: 'Studio detail',
    },
    { status: 404, description: 'Studio not found' },
    { status: 500, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'put',
  path: '/crm/studios/{id}',
  summary: 'Update studio',
  description: 'Update an existing studio record',
  tags: ['Studios'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Studio ID',
    },
  ],
  requestBody: {
    schema: UpdateStudioPayloadSchema,
    description: 'Studio update payload',
  },
  responses: [
    { status: 200, schema: UpdateStudioResponseSchema, description: 'Studio updated' },
    { status: 400, description: 'Bad request - validation error' },
    { status: 404, description: 'Studio not found' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/studios/{id}',
  summary: 'Delete studio',
  description: 'Delete an existing studio record',
  tags: ['Studios'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Studio ID',
    },
  ],
  responses: [
    { status: 204, description: 'Studio deleted' },
    { status: 404, description: 'Studio not found' },
    { status: 409, description: 'Studio is in use by linked lessons' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 });
    }

    // Phase 1 mock: return all studio details (role scoping will be wired to auth context in Phase 2)
    const mockRole: StaffRole = 'headquarter';
    const mockStoreIds: string[] = [];
    const detailData = db.studios.getStudioDetailById(id, mockRole, mockStoreIds);

    if (!detailData) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Validate response structure
    const result = GetStudioDetailResponseSchema.safeParse(detailData);
    if (!result.success) {
      console.error('Studio detail validation error:', result.error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/crm/studios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = UpdateStudioPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;
    const result = db.studios.update({ id, ...data });
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/crm/studios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 });
    }

    const result = db.studios.delete(id);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }
    if (result === 'in_use') {
      return NextResponse.json(
        { error: 'このスタジオはレッスンで使用中のため削除できません。' },
        { status: 409 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/crm/studios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
