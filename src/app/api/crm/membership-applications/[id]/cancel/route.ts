import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type CancelRequest,
  CancelRequestSchema,
  type CancelResponse,
  CancelResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/cancel',
  summary: 'Cancel membership application',
  description: 'Cancel a membership application (post-approval cancellation)',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: CancelRequestSchema,
    description: 'Cancellation information',
  },
  responses: [
    {
      status: 200,
      schema: CancelResponseSchema,
      description: 'Application cancelled successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Application not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// POST /api/crm/membership-applications/{id}/cancel - 後から却下
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = CancelRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: CancelRequest = validationResult.data;
    const { cancellation_reason, staff_id } = validatedBody;

    const updated = db.membershipApplications.updateStatus(id, 'cancelled');
    if (!updated) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const response: CancelResponse = {
      success: true,
      application_id: id,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: staff_id || 'staff-001',
      cancellation_reason: cancellation_reason,
      refund_processed: true,
      refund_amount: 5000,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error cancelling application:', error);
    return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 });
  }
}
