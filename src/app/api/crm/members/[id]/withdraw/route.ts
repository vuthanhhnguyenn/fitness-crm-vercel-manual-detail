import { NextRequest, NextResponse } from 'next/server';

import { WITHDRAWAL_MIN_LEAD_DAYS, validateProxyAgreement } from '@/app/api/_lib/member-operation';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  WithdrawRequestSchema,
  WithdrawResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { addDays, isBefore, parseISO, startOfToday } from 'date-fns';

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

// Gate stop is no longer one of these values — it is an orthogonal flag, so a
// gate-stopped member reaches this check under their own status (active /
// suspended) and stays withdrawable.
const WITHDRAWABLE_STATUSES: string[] = [MemberStatus.ACTIVE, MemberStatus.SUSPENDED];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!WITHDRAWABLE_STATUSES.includes(member.memberStatus)) {
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

    const { scheduled_date, reason, withdrawal_type, is_proxy, proxy_agreed_at } =
      validationResult.data;

    // A-01 FR-014 / BR-WDR-001. The type is derived by the client from the contract's usage
    // start date; the server re-derives the constraint from its own copy so a stale client
    // cannot slip a same-day 通常退会 through.
    const usageStartDate = member.currentMainContract?.usageStartDate;
    const scheduled = parseISO(scheduled_date);
    if (withdrawal_type === 'cancellation') {
      if (!usageStartDate || !isBefore(scheduled, parseISO(usageStartDate.slice(0, 10)))) {
        return NextResponse.json(
          { error: '入会取り消しは利用開始日より前の日付のみ指定できます' },
          { status: 400 },
        );
      }
    } else if (isBefore(scheduled, addDays(startOfToday(), WITHDRAWAL_MIN_LEAD_DAYS))) {
      return NextResponse.json(
        { error: `退会予定日は${WITHDRAWAL_MIN_LEAD_DAYS}日以上先の日付を指定してください` },
        { status: 400 },
      );
    }

    // A-01 FR-017: a proxy application must carry a plausible agreement timestamp
    const proxyError = validateProxyAgreement({ is_proxy, proxy_agreed_at });
    if (proxyError) {
      return NextResponse.json({ error: proxyError.message }, { status: 400 });
    }

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
