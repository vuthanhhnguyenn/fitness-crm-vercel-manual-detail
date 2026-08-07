import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  MemberBasicInfoSchema,
  type UpdateBasicInfoRequest,
  UpdateBasicInfoRequestSchema,
  type UpdateBasicInfoResponse,
  UpdateBasicInfoResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for GET route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/basic-info',
  summary: 'Get member basic info',
  description: 'Get basic information of a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: MemberBasicInfoSchema,
      description: 'Member basic info',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// Register OpenAPI documentation for PUT route
registerRoute({
  method: 'put',
  path: '/crm/members/{id}/basic-info',
  summary: 'Update member basic info',
  description: 'Update basic information of a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateBasicInfoRequestSchema,
    description: 'Updated basic info',
  },
  responses: [
    {
      status: 200,
      schema: UpdateBasicInfoResponseSchema,
      description: 'Basic info updated successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member.basic_info);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch basic info' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = UpdateBasicInfoRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateBasicInfoRequest = validationResult.data;
    const updatedMember = db.members.updateBasicInfo(id, validatedBody);
    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const response: UpdateBasicInfoResponse = updatedMember.basic_info as any;
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Failed to update basic info' }, { status: 500 });
  }
}
