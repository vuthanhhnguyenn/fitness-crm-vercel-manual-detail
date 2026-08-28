import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  WithdrawCancelRequestSchema,
  WithdrawCancelResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/withdraw-cancel',
  summary: 'Cancel a pending withdrawal',
  description: 'Cancel a pending withdrawal (退会取り消し) and revert member status to active',
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
    schema: WithdrawCancelRequestSchema,
    description: 'Optional cancellation reason recorded for audit',
  },
  responses: [
    {
      status: 200,
      schema: WithdrawCancelResponseSchema,
      description: 'Withdrawal cancelled successfully',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Member is not in pending_withdrawal state',
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

    if (member.memberStatus !== MemberStatus.PENDING_WITHDRAWAL) {
      return NextResponse.json({ error: '退会予定の会員ではありません' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = WithdrawCancelRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.members.handleWithdrawCancel(id);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to cancel the withdrawal' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member_id: id }, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/withdraw-cancel]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
