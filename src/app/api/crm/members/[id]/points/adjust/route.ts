import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type PointAdjustmentRequest,
  PointAdjustmentRequestSchema,
  type PointAdjustmentResponse,
  PointAdjustmentResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/members/{id}/points/adjust',
  summary: 'Adjust member points',
  description: 'Adjust points for a member (alternative endpoint)',
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
    schema: PointAdjustmentRequestSchema,
    description: 'Point adjustment details',
  },
  responses: [
    {
      status: 200,
      schema: PointAdjustmentResponseSchema,
      description: 'Points adjusted successfully',
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = PointAdjustmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: PointAdjustmentRequest = validationResult.data;
    const response: PointAdjustmentResponse = {
      id,
      adjustment: validatedBody,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adjusting points:', error);
    return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 });
  }
}
