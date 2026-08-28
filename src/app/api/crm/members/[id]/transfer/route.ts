import { NextRequest, NextResponse } from 'next/server';

import { validateProxyAgreement } from '@/app/api/_lib/member-operation';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  TransferRequestBodySchema,
  TransferResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/transfer',
  summary: 'Submit a transfer request for a member',
  description: 'Submit a transfer application (移籍申請) for an active member',
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
    schema: TransferRequestBodySchema,
    description: 'Transfer request payload',
  },
  responses: [
    {
      status: 200,
      schema: TransferResponseSchema,
      description: 'Transfer request accepted',
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
      description: 'Member is not in a state that allows transfer',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const TRANSFERABLE_STATUSES: string[] = [MemberStatus.ACTIVE];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!TRANSFERABLE_STATUSES.includes(member.memberStatus)) {
      return NextResponse.json(
        { error: 'Member is not in a state that allows transfer' },
        { status: 409 },
      );
    }

    if (member.constraints.inCancellationPeriod) {
      return NextResponse.json({ error: '解約手数料期間中のため移籍できません' }, { status: 409 });
    }

    if (member.constraints.hasUnpaidFee) {
      return NextResponse.json({ error: '未納金があるため移籍申請できません' }, { status: 409 });
    }

    const body = await request.json();
    const validationResult = TransferRequestBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { to_store_id, to_store_name, reason, is_proxy, proxy_agreed_at, proxy_method } =
      validationResult.data;

    // A-01 FR-017: a proxy application must carry a plausible agreement timestamp
    const proxyError = validateProxyAgreement({ is_proxy, proxy_agreed_at });
    if (proxyError) {
      return NextResponse.json({ error: proxyError.message }, { status: 400 });
    }

    // G-E: the proxy block used to be validated and then dropped here, so a transfer made on
    // the member's behalf left no 代理申請 trail at all. Pass it through like 休会申請 does.
    const result = db.members.handleTransfer({
      id,
      to_store_id,
      to_store_name,
      reason,
      is_proxy,
      proxy_agreed_at,
      proxy_method,
    });
    if (!result) {
      return NextResponse.json({ error: 'Failed to process transfer request' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        member_id: id,
        transfer_id: result.transfer_id,
        to_store_id,
        to_store_name,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[POST /crm/members/[id]/transfer]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
