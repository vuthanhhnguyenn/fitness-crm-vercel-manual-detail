import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ReEnrollRequest,
  ReEnrollRequestSchema,
  ReEnrollResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/re-enroll',
  summary: 'Re-enroll a withdrawn member',
  description: 'Re-enroll a member who has withdrawn or been force-withdrawn',
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
    schema: ReEnrollRequestSchema,
    description: 'Re-enrollment payload',
  },
  responses: [
    {
      status: 200,
      schema: ReEnrollResponseSchema,
      description: 'Re-enrollment accepted',
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
      description: 'Member is not in a withdrawn state',
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

    // FR-023: re-enrollment bypasses C-01's blacklist screening, so it must carry its own guard
    if (member.blacklist?.isActive) {
      return NextResponse.json(
        { error: 'ブラックリスト登録者のため再入会できません' },
        { status: 422 },
      );
    }
    if (member.constraints.hasUnpaidFee || member.unpaidAmount > 0) {
      return NextResponse.json({ error: '未納金があるため再入会できません' }, { status: 422 });
    }

    const withdrawnStatuses: string[] = [MemberStatus.WITHDRAWN, MemberStatus.FORCED_WITHDRAWAL];
    if (!withdrawnStatuses.includes(member.memberStatus)) {
      return NextResponse.json({ error: 'Member is not in a withdrawn state' }, { status: 409 });
    }

    const body = await request.json();
    const validationResult = ReEnrollRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: ReEnrollRequest = validationResult.data;

    // Directly update member status in mock DB
    const members = (
      db.members as unknown as {
        _members: Array<{ memberId: string; memberStatus: string; withdrawnAt?: string }>;
      }
    )._members;
    const idx = members.findIndex((m) => m.memberId === id);
    if (idx !== -1) {
      members[idx].memberStatus = MemberStatus.ACTIVE;
      members[idx].withdrawnAt = undefined;
    }

    return NextResponse.json({
      success: true,
      member_id: id,
      re_enroll_month: validatedBody.re_enroll_month,
      plan_id: validatedBody.plan_id,
      fee_waived: validatedBody.fee_waived,
    });
  } catch (error) {
    console.error('Error processing re-enrollment:', error);
    return NextResponse.json({ error: 'Failed to process re-enrollment' }, { status: 500 });
  }
}
