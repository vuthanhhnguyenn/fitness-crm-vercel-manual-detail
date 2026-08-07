import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type ApproveRequest,
  ApproveRequestSchema,
  type ApproveResponse,
  ApproveResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/approve',
  summary: 'Approve membership application',
  description: 'Manually approve a membership application',
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
    schema: ApproveRequestSchema,
    description: 'Approval information',
  },
  responses: [
    {
      status: 200,
      schema: ApproveResponseSchema,
      description: 'Application approved successfully',
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

// POST /api/crm/membership-applications/{id}/approve - 手動承認
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Body is optional for this endpoint; handle empty body safely.
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Validate request body with Zod
    const validationResult = ApproveRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: ApproveRequest = validationResult.data;
    const { approval_reason, staff_id } = validatedBody;

    const application = db.membershipApplications.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const alreadyApproved = application.status === 'approved';

    db.membershipApplications.updateStatus(id, 'approved');

    // Prefer edited detail fields (plan/start_date) when creating contract
    const details = db.membershipApplications.getDetails(id);
    const applicationForContract = {
      ...application,
      ...(details?.applicant_name ? { applicant_name: details.applicant_name } : {}),
      ...(details?.contract_details?.plan_name
        ? { plan_name: details.contract_details.plan_name }
        : {}),
      ...(details?.contract_details?.start_date
        ? { start_date: details.contract_details.start_date }
        : {}),
    };

    const existingContractRow = db.contracts.getByApplicationId(id);

    const member_id = (() => {
      if (existingContractRow?.member_id) return existingContractRow.member_id;
      if (alreadyApproved) return '';
      const member = db.members.createFromApplication(details);
      db.contracts.createFromApprovedApplication({
        application: applicationForContract,
        member_id: member.basic_info.id,
      });
      return member.basic_info.id;
    })();

    if (!member_id) {
      return NextResponse.json({ error: 'Failed to resolve member_id' }, { status: 500 });
    }

    const response: ApproveResponse = {
      success: true,
      application_id: id,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: staff_id || 'staff-001',
      approval_reason: approval_reason || '手動承認',
      member_id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
