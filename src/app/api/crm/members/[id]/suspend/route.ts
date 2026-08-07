import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  SuspendRequestSchema,
  SuspendResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/suspend',
  summary: 'Submit a suspension request for a member',
  description: 'Submit a suspension (休会申請) request for an active member',
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
    schema: SuspendRequestSchema,
    description: 'Suspension request payload',
  },
  responses: [
    {
      status: 200,
      schema: SuspendResponseSchema,
      description: 'Suspension request accepted',
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
      description: 'Member is not in a state that allows suspension',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const SUSPENDABLE_STATUSES: string[] = [MemberStatus.ACTIVE];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!SUSPENDABLE_STATUSES.includes(member.profile.status)) {
      return NextResponse.json(
        { error: 'Member is not in a state that allows suspension' },
        { status: 409 },
      );
    }

    if (member.constraints?.hasUnpaidFee) {
      return NextResponse.json(
        { error: '未納金が発生しているため休会申請できません' },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validationResult = SuspendRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { start_month, end_month, reason, is_proxy, proxy_agreed_at, proxy_method } =
      validationResult.data;

    const result = db.members.handleSuspension({
      id,
      start_month,
      end_month,
      reason,
      is_proxy,
      proxy_agreed_at,
      proxy_method,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to process suspension' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        member_id: id,
        start_month,
        end_month,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[POST /crm/members/[id]/suspend]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
