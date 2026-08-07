import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type InviteStaffRequest,
  InviteStaffRequestSchema,
  type InviteStaffResponse,
  InviteStaffResponseSchema,
} from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for POST
registerRoute({
  method: 'post',
  path: '/crm/staffs/invite',
  summary: 'Invite staff members',
  description: 'Send invitation emails to new staff members',
  tags: ['Staffs'],
  requestBody: {
    schema: InviteStaffRequestSchema,
    description: 'Staff invitation request body',
  },
  responses: [
    {
      status: 200,
      schema: InviteStaffResponseSchema,
      description: 'Invitations sent successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = InviteStaffRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: InviteStaffRequest = validationResult.data;
    const { invitees } = validatedBody;

    // Create staff entries for each invitee with role
    const newStaffs = invitees.map((invitee) =>
      db.staffs.create({
        email: invitee.email,
        role: invitee.role,
        brand: invitee.brand,
      }),
    );

    const response: InviteStaffResponse = {
      message: '招待メールを送信しました',
      invited_count: newStaffs.length,
      staffs: newStaffs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error inviting staff:', error);
    return NextResponse.json({ error: 'スタッフの招待に失敗しました' }, { status: 500 });
  }
}
