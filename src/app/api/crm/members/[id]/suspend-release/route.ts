import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  SuspendReleaseRequestSchema,
  SuspendReleaseResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/suspend-release',
  summary: 'Release a suspension for a member',
  description: 'Release an active suspension (休会解除) and revert member status to active',
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
    schema: SuspendReleaseRequestSchema,
    description: 'Suspend release request payload',
  },
  responses: [
    {
      status: 200,
      schema: SuspendReleaseResponseSchema,
      description: 'Suspension released successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Member is not in suspended state',
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

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.profile.status !== MemberStatus.SUSPENDED) {
      return NextResponse.json({ error: 'Member is not in suspended state' }, { status: 409 });
    }

    const body = await request.json();
    const validationResult = SuspendReleaseRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { resume_month } = validationResult.data;

    const result = db.members.handleSuspendRelease({ id, resume_month });
    if (!result) {
      return NextResponse.json({ error: 'Failed to release suspension' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member_id: id, resume_month }, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/suspend-release]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
