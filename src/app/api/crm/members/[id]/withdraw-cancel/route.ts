import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
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

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.profile.status !== MemberStatus.PENDING_WITHDRAWAL) {
      return NextResponse.json(
        { error: 'Member is not in pending_withdrawal state' },
        { status: 409 },
      );
    }

    const members = (
      db.members as unknown as {
        _members: Array<{ basic_info: { id: string }; profile: { status: string } }>;
      }
    )._members;
    const idx = members.findIndex((m) => m.basic_info.id === id);
    if (idx !== -1) {
      members[idx].profile.status = MemberStatus.ACTIVE;
    }

    return NextResponse.json({ success: true, member_id: id }, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/withdraw-cancel]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
