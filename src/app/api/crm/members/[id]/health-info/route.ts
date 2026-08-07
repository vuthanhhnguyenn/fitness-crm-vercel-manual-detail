import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type UpdateHealthInfoRequest,
  UpdateHealthInfoRequestSchema,
  type UpdateHealthInfoResponse,
  UpdateHealthInfoResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'put',
  path: '/crm/members/{id}/health-info',
  summary: 'Update member health info',
  description: 'Update health information of a member',
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
    schema: UpdateHealthInfoRequestSchema,
    description: 'Updated health info',
  },
  responses: [
    {
      status: 200,
      schema: UpdateHealthInfoResponseSchema,
      description: 'Health info updated successfully',
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = UpdateHealthInfoRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateHealthInfoRequest = validationResult.data;
    const updatedMember = db.members.updateHealthInfo(id, validatedBody);
    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const response: UpdateHealthInfoResponse = updatedMember.health_info as any;
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Failed to update health info' }, { status: 500 });
  }
}
