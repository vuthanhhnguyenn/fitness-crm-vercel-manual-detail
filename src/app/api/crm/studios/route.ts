import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateStudioPayloadSchema,
  CreateStudioResponseSchema,
  type GetStudiosQuery,
  GetStudiosQuerySchema,
  StudioListResponseSchema,
} from '@/app/api/_schemas/studio.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';

registerRoute({
  method: 'get',
  path: '/crm/studios',
  summary: 'Get studio list',
  description: 'Get paginated list of studios with search, filter, sort',
  tags: ['Studios'],
  query: GetStudiosQuerySchema,
  responses: [
    { status: 200, schema: StudioListResponseSchema, description: 'Studio list' },
    { status: 400, schema: StudioListResponseSchema, description: 'Bad request' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/studios',
  summary: 'Create studio',
  description: 'Create a new studio record with optional images and space layout',
  tags: ['Studios'],
  requestBody: {
    schema: CreateStudioPayloadSchema,
    description: 'Studio create payload',
  },
  responses: [
    { status: 201, schema: CreateStudioResponseSchema, description: 'Studio created' },
    { status: 400, description: 'Bad request - validation error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetStudiosQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetStudiosQuery = validationResult.data;
    // Phase 1 mock: return all studios (role scoping will be added in Phase 2)
    const mockRole: StaffRole = 'headquarter';
    const mockStoreIds: string[] = [];

    const response = db.studios.list(query, mockRole, mockStoreIds);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/crm/studios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateStudioPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;
    const result = db.studios.create(data);
    const response = { id: result.id };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST /api/crm/studios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
