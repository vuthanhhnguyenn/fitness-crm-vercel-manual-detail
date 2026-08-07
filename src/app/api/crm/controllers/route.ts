import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type CreateControllerResponse,
  CreateControllerResponseSchema,
  type GetControllersQuery,
  GetControllersQuerySchema,
  type GetControllersResponse,
  GetControllersResponseSchema,
  UpsertControllerRequestSchema,
} from '@/app/api/_schemas/controller.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/controllers',
  summary: 'Get contact-control devices',
  description:
    'Get paginated list of contact-control devices (接点制御装置) with search, status/store filtering and sorting',
  tags: ['Controllers'],
  query: GetControllersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetControllersResponseSchema,
      description: 'List of contact-control devices',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/controllers',
  summary: 'Create contact-control device',
  description: 'Register a new contact-control device (接点制御装置) (FR-007)',
  tags: ['Controllers'],
  requestBody: {
    schema: UpsertControllerRequestSchema,
    description: 'Contact-control device create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateControllerResponseSchema,
      description: 'Contact-control device created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetControllersQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const query: GetControllersQuery = validationResult.data;
    const response: GetControllersResponse = db.controllers.list(query);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching controllers:', error);
    return NextResponse.json({ error: 'Failed to fetch controllers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = UpsertControllerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const controller = db.controllers.create(validationResult.data);
    const response: CreateControllerResponse = controller;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating controller:', error);
    return NextResponse.json({ error: 'Failed to create controller' }, { status: 500 });
  }
}
