import { NextRequest, NextResponse } from 'next/server';

import { toMainContractResponse } from '@/app/api/_lib/member-contract';
import { db } from '@/app/api/_mock-db';
import {
  type ChangeMainContractRequest,
  ChangeMainContractRequestSchema,
  ChangeMainContractResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatISODateLocal } from '@/utils/date.util';
import { addMonths, startOfMonth } from 'date-fns';

registerRoute({
  method: 'patch',
  path: '/crm/members/{id}/contracts/main-contract/change',
  summary: 'Register a member main-contract change application',
  description:
    'A-01 FR-013a: records a pending plan-change application applied from the 1st of the following month. The current plan is left unchanged, and only one application may be pending at a time.',
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
    schema: ChangeMainContractRequestSchema,
    description: 'New main contract id',
  },
  responses: [
    {
      status: 200,
      schema: ChangeMainContractResponseSchema,
      description: 'Change application registered; the contract carries pendingPlanChange',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request (invalid body, or the destination equals the current plan)',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member or contract not found',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'A plan-change application is already pending for this member',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = ChangeMainContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: ChangeMainContractRequest = validationResult.data;
    const current = db.contracts.getByMemberId(id);
    if (!current) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    const targetMainContract = db.mainContracts
      .getList()
      .find((contract) => contract.id === validatedBody.contract_id);
    if (!targetMainContract) {
      return NextResponse.json({ error: 'Main contract not found' }, { status: 404 });
    }

    // A-01 FR-013a: only one application may be pending at a time — the client also disables the
    // trigger, but a stale tab must not be able to create a second one.
    if (current.main_contract.pending_plan_change) {
      return NextResponse.json(
        { error: '主契約の変更申請が既に登録されています', code: 'E-PLAN-409' },
        { status: 409 },
      );
    }

    if (targetMainContract.id === current.main_contract.id) {
      return NextResponse.json({ error: '現在と同じ主契約は選択できません' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    // A-01 FR-006: the change applies from the 1st of the following month
    const effectiveFrom = formatISODateLocal(startOfMonth(addMonths(new Date(), 1)));

    // The plan itself is NOT mutated — the application is recorded and applied at month start.
    const nextMainContract = {
      ...current.main_contract,
      start_date: current.main_contract.start_date || today,
      pending_plan_change: {
        // A member-level request, as opposed to an HQ bulk job — the detail screen
        // words the two differently (QA09 §2.2).
        source: 'application' as const,
        source_id: `ppc-${id}-${now.slice(0, 10).replace(/-/g, '')}`,
        application_id: `ppc-${id}-${now.slice(0, 10).replace(/-/g, '')}`,
        to_plan_id: targetMainContract.id,
        to_plan_name: targetMainContract.name,
        to_monthly_fee: targetMainContract.price_including_tax,
        effective_from: effectiveFrom,
        requested_at: now,
        requested_by: '管理者A',
      },
    };

    db.contracts.create({
      contract_id: member.currentMainContract?.contractId || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...current,
        main_contract: nextMainContract,
      },
    });

    return NextResponse.json(toMainContractResponse(nextMainContract));
  } catch {
    return NextResponse.json({ error: 'Failed to change main contract' }, { status: 500 });
  }
}
