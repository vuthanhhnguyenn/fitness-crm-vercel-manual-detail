import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ForceWithdrawRequestSchema,
  ForceWithdrawResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/force-withdraw',
  summary: '強制退会を実行する',
  description:
    '会員ステータスを force_withdrawn に更新し、退会記録とブラックリスト登録を同時に行う。',
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
    schema: ForceWithdrawRequestSchema,
    description: '強制退会リクエスト',
  },
  responses: [
    {
      status: 200,
      schema: ForceWithdrawResponseSchema,
      description: '強制退会処理成功',
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
      description: 'Member is not in a state that allows force withdrawal',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const FORCE_WITHDRAWABLE_STATUSES: string[] = [
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

    if (!FORCE_WITHDRAWABLE_STATUSES.includes(member.profile.status)) {
      return NextResponse.json(
        { error: 'Member is not in a state that allows force withdrawal' },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validationResult = ForceWithdrawRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { reason } = validationResult.data;

    const result = db.members.handleForceWithdrawal({ id, reason });
    if (!result) {
      return NextResponse.json({ error: 'Failed to process force withdrawal' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        member_id: id,
        blacklist_id: result.blacklistId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[POST /crm/members/:id/force-withdraw]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
