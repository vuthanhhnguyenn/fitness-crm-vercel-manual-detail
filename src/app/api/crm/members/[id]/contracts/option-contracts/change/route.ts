import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ChangeOptionContractRequest,
  ChangeOptionContractRequestSchema,
  ChangeOptionContractResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/members/{id}/contracts/option-contracts/change',
  summary: 'Change member option contract',
  description: 'Replace a current option contract with another option',
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
    schema: ChangeOptionContractRequestSchema,
    description: 'Option change payload',
  },
  responses: [
    {
      status: 200,
      schema: ChangeOptionContractResponseSchema,
      description: 'Changed option contract',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member or contracts not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getFirstDayOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = ChangeOptionContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const validatedBody: ChangeOptionContractRequest = validationResult.data;

    if (validatedBody.current_option_id === validatedBody.next_option_id) {
      return NextResponse.json(
        { error: 'Current and next option cannot be the same' },
        { status: 400 },
      );
    }

    const currentContracts = db.contracts.getByMemberId(id);
    if (!currentContracts) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    const currentOption = currentContracts.option_contracts.find(
      (option) => option.id === validatedBody.current_option_id,
    );
    if (!currentOption) {
      return NextResponse.json({ error: 'Current option contract not found' }, { status: 404 });
    }

    const nextOptionMaster = db.optionMasters
      .getList()
      .find((option) => option.id === validatedBody.next_option_id);
    if (!nextOptionMaster) {
      return NextResponse.json({ error: 'Next option master not found' }, { status: 404 });
    }

    const now = new Date();
    const applyDate = getFirstDayOfNextMonth(now);
    const applyDateText = toDateOnly(applyDate);
    const nextOptionContract = {
      id: nextOptionMaster.id,
      name: nextOptionMaster.name,
      monthly_fee: nextOptionMaster.price_including_tax,
      start_date: applyDateText,
      next_billing_date: applyDateText,
    };

    const filteredOptionContracts = currentContracts.option_contracts.filter(
      (option) => option.id !== validatedBody.current_option_id,
    );

    db.contracts.create({
      contract_id: member.profile.contract_id || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...currentContracts,
        option_contracts: [nextOptionContract, ...filteredOptionContracts],
        option_change_history: [
          {
            changed_at: now.toISOString(),
            option_name: currentOption.name,
            action_type: 'remove',
            notes: `オプション変更（${nextOptionMaster.name}へ）`,
          },
          {
            changed_at: now.toISOString(),
            option_name: nextOptionMaster.name,
            action_type: 'add',
            notes: `オプション変更（${currentOption.name}から）`,
          },
          ...currentContracts.option_change_history,
        ],
      },
    });

    return NextResponse.json({
      removed_option_id: validatedBody.current_option_id,
      added_option: nextOptionContract,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to change option contract' }, { status: 500 });
  }
}
