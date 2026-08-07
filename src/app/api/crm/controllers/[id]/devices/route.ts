import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetControllerDevicesResponse,
  GetControllerDevicesResponseSchema,
} from '@/app/api/_schemas/controller.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/controllers/{id}/devices',
  summary: 'Get connected equipment for a controller',
  description: 'Get the list of connected equipment linked to a contact-control device (FR-007-D)',
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
      schema: GetControllerDevicesResponseSchema,
      description: 'Connected equipment list',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 404, schema: ErrorResponseSchema, description: 'Controller not found' },
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
    if (!db.controllers.getById(id)) {
      return NextResponse.json({ error: 'Controller not found' }, { status: 404 });
    }

    const response: GetControllerDevicesResponse = db.controllers.getConnectedDevices(id);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching controller devices:', error);
    return NextResponse.json({ error: 'Failed to fetch controller devices' }, { status: 500 });
  }
}
