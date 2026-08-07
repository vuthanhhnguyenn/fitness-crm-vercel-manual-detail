import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type RejectRequest,
  RejectRequestSchema,
  type RejectResponse,
  RejectResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/reject',
  summary: 'Reject membership application',
  description: 'Reject a membership application',
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
    schema: RejectRequestSchema,
    description: 'Rejection information',
  },
  responses: [
    {
      status: 200,
      schema: RejectResponseSchema,
      description: 'Application rejected successfully',
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

// POST /api/crm/membership-applications/{id}/reject - 却下
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = RejectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: RejectRequest = validationResult.data;
    const { rejection_reason, staff_id } = validatedBody;

    const updated = db.membershipApplications.updateStatus(id, 'rejected');
    if (!updated) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const response: RejectResponse = {
      success: true,
      application_id: id,
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: staff_id || 'staff-001',
      rejection_reason: rejection_reason,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error rejecting application:', error);
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }
}
