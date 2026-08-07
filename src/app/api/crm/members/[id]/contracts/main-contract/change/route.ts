import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type ChangeMainContractRequest,
  ChangeMainContractRequestSchema,
  ChangeMainContractResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/members/{id}/contracts/main-contract/change',
  summary: 'Change member main contract',
  description: 'Submit a request to change the member main contract',
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
      description: 'Main contract changed successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member or contract not found',
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

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const nextMainContract = {
      ...current.main_contract,
      plan_name: targetMainContract.name,
      monthly_fee: targetMainContract.price_including_tax,
      change_history: [
        {
          changed_at: now,
          previous_plan: current.main_contract.plan_name,
          new_plan: targetMainContract.name,
          reason: '主契約変更',
        },
        ...current.main_contract.change_history,
      ],
      start_date: current.main_contract.start_date || today,
    };

    db.contracts.create({
      contract_id: member.profile.contract_id || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...current,
        main_contract: nextMainContract,
      },
    });

    return NextResponse.json(nextMainContract);
  } catch {
    return NextResponse.json({ error: 'Failed to change main contract' }, { status: 500 });
  }
}
