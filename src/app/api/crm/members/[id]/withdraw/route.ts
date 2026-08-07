import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  WithdrawRequestSchema,
  WithdrawResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/withdraw',
  summary: 'Submit a withdrawal request for a member',
  description: 'Submit a withdrawal application (退会申請) for an active member',
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
    schema: WithdrawRequestSchema,
    description: 'Withdrawal request payload',
  },
  responses: [
    {
      status: 200,
      schema: WithdrawResponseSchema,
      description: 'Withdrawal request accepted',
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
      description: 'Member is not in a state that allows withdrawal',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const WITHDRAWABLE_STATUSES: string[] = [
  MemberStatus.ACTIVE,
  MemberStatus.SUSPENDED,
  MemberStatus.GATE_STOP,
];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!WITHDRAWABLE_STATUSES.includes(member.profile.status)) {
      return NextResponse.json(
        { error: 'Member is not in a state that allows withdrawal' },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validationResult = WithdrawRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { scheduled_date, reason } = validationResult.data;

    const result = db.members.handleWithdrawal({ id, scheduled_date, reason });
    if (!result) {
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        member_id: id,
        scheduled_date,
        reason,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[POST /crm/members/[id]/withdraw]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
