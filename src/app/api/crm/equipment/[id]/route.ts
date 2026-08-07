import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEquipmentDetailResponse,
  GetEquipmentDetailResponseSchema,
  PatchEquipmentRequestSchema,
  type UpdateEquipmentResponse,
  UpdateEquipmentResponseSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/equipment/{id}',
  summary: 'Get connected equipment detail',
  description: 'Get detailed information for a specific connected equipment record',
  tags: ['Equipment'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Connected equipment ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetEquipmentDetailResponseSchema,
      description: 'Connected equipment detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Equipment not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/equipment/{id}',
  summary: 'Update connected equipment',
  description: 'Update an existing connected equipment record (FR-005)',
  tags: ['Equipment'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Connected equipment ID',
    },
  ],
  requestBody: {
    schema: PatchEquipmentRequestSchema,
    description: 'Connected equipment update payload (partial — only changed fields)',
  },
  responses: [
    {
      status: 200,
      schema: UpdateEquipmentResponseSchema,
      description: 'Connected equipment updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 404, schema: ErrorResponseSchema, description: 'Equipment not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/equipment/{id}',
  summary: 'Delete connected equipment',
  description: 'Delete a connected equipment record',
  tags: ['Equipment'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Connected equipment ID',
    },
  ],
  responses: [
    { status: 204, description: 'Deleted successfully' },
    { status: 404, schema: ErrorResponseSchema, description: 'Equipment not found' },
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
    const equipment = db.equipment.getDetailById(id);

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const response: GetEquipmentDetailResponse = { equipment };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching equipment detail:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment detail' }, { status: 500 });
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
    const validationResult = PatchEquipmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const equipment = db.equipment.update(id, validationResult.data);
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const response: UpdateEquipmentResponse = { equipment };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
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

    if (!db.equipment.getById(id)) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const deleted = db.equipment.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
