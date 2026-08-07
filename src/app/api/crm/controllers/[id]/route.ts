import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetControllerDetailResponse,
  GetControllerDetailResponseSchema,
  PatchControllerRequestSchema,
  type UpdateControllerResponse,
  UpdateControllerResponseSchema,
} from '@/app/api/_schemas/controller.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/controllers/{id}',
  summary: 'Get contact-control device detail',
  description: 'Get detailed information for a specific contact-control device',
  tags: ['Controllers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Contact-control device ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetControllerDetailResponseSchema,
      description: 'Contact-control device detail',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 404, schema: ErrorResponseSchema, description: 'Controller not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/controllers/{id}',
  summary: 'Update contact-control device',
  description:
    'Update an existing contact-control device (FR-007). Also used for status-only changes.',
  tags: ['Controllers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Contact-control device ID',
    },
  ],
  requestBody: {
    schema: PatchControllerRequestSchema,
    description: 'Contact-control device update payload (partial — only changed fields)',
  },
  responses: [
    {
      status: 200,
      schema: UpdateControllerResponseSchema,
      description: 'Contact-control device updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 404, schema: ErrorResponseSchema, description: 'Controller not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/controllers/{id}',
  summary: 'Delete contact-control device',
  description:
    'Delete a contact-control device. Blocked (409) while connected equipment remain (delete guard).',
  tags: ['Controllers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Contact-control device ID',
    },
  ],
  responses: [
    { status: 204, description: 'Deleted successfully' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 404, schema: ErrorResponseSchema, description: 'Controller not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Has connected equipment' },
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
    const controller = db.controllers.getDetailById(id);
    if (!controller) {
      return NextResponse.json({ error: 'Controller not found' }, { status: 404 });
    }

    const response: GetControllerDetailResponse = controller;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching controller detail:', error);
    return NextResponse.json({ error: 'Failed to fetch controller detail' }, { status: 500 });
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
    const validationResult = PatchControllerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const controller = db.controllers.update(id, validationResult.data);
    if (!controller) {
      return NextResponse.json({ error: 'Controller not found' }, { status: 404 });
    }

    const response: UpdateControllerResponse = controller;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating controller:', error);
    return NextResponse.json({ error: 'Failed to update controller' }, { status: 500 });
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
    if (!db.controllers.getById(id)) {
      return NextResponse.json({ error: 'Controller not found' }, { status: 404 });
    }

    const result = db.controllers.delete(id);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: '紐付き機器が存在するため削除できません',
          reason: result.reason,
          device_count: result.device_count,
        },
        { status: 409 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting controller:', error);
    return NextResponse.json({ error: 'Failed to delete controller' }, { status: 500 });
  }
}
