import { NextRequest, NextResponse } from 'next/server';

import { toMainContractResponse } from '@/app/api/_lib/member-contract';
import { db } from '@/app/api/_mock-db';
import {
  CancelPlanChangeRequestSchema,
  CancelPlanChangeResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/contracts/main-contract/change/cancel',
  summary: 'Cancel a pending main-contract change application',
  description:
    'A-01 FR-013a: cancels the pending plan-change application so the member stays on the current plan. The design doc has no cancel operation yet — see specs/022-member-detail-tabs/contracts/mock-api.md BR-1.',
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
    schema: CancelPlanChangeRequestSchema,
    description: 'Pending plan-change application id',
  },
  responses: [
    {
      status: 200,
      schema: CancelPlanChangeResponseSchema,
      description: 'Application cancelled; the contract no longer carries pendingPlanChange',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member, contract, or pending application not found',
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

    const body = await request.json();
    const validationResult = CancelPlanChangeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const current = db.contracts.getByMemberId(id);
    if (!current) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    const pending = current.main_contract.pending_plan_change;
    if (!pending || pending.application_id !== validationResult.data.application_id) {
      return NextResponse.json({ error: '対象の変更申請が見つかりません' }, { status: 404 });
    }

    const mainContractWithoutPending = { ...current.main_contract };
    delete mainContractWithoutPending.pending_plan_change;

    db.contracts.create({
      contract_id: member.currentMainContract?.contractId || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...current,
        main_contract: mainContractWithoutPending,
      },
    });

    return NextResponse.json(toMainContractResponse(mainContractWithoutPending));
  } catch {
    return NextResponse.json(
      { error: 'Failed to cancel plan change application' },
      { status: 500 },
    );
  }
}
