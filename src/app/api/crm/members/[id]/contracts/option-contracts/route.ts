import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  AddOptionContractRequestSchema,
  AddOptionContractResponseSchema,
  ErrorResponseSchema,
  GetOptionContractsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/contracts/option-contracts',
  summary: 'Add member option contract',
  description: 'Add an option contract for a member',
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
    schema: AddOptionContractRequestSchema,
    description: 'Option add payload',
  },
  responses: [
    {
      status: 200,
      schema: AddOptionContractResponseSchema,
      description: 'Added option contract',
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

function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getFirstDayOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = AddOptionContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const currentContracts = db.contracts.getByMemberId(id);
    if (!currentContracts) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    const optionMaster = db.optionMasters
      .getList()
      .find((option) => option.id === validationResult.data.option_id);
    if (!optionMaster) {
      return NextResponse.json({ error: 'Option master not found' }, { status: 404 });
    }

    const alreadyExists = currentContracts.option_contracts.some(
      (opt) => opt.id === optionMaster.id,
    );
    if (alreadyExists) {
      return NextResponse.json({ error: 'Option already contracted' }, { status: 400 });
    }

    const now = new Date();
    const startDate =
      validationResult.data.apply_from === 'today' ? now : getFirstDayOfNextMonth(now);
    const nextBillingBase =
      validationResult.data.apply_from === 'today' ? now : getFirstDayOfMonth(startDate);
    const nextBillingDate = getFirstDayOfNextMonth(nextBillingBase);
    const nowIso = now.toISOString();

    const newOptionContract = {
      id: optionMaster.id,
      name: optionMaster.name,
      monthly_fee: optionMaster.price_including_tax,
      start_date: toDateOnly(startDate),
      next_billing_date: toDateOnly(nextBillingDate),
    };

    db.contracts.create({
      contract_id: member.profile.contract_id || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...currentContracts,
        option_contracts: [newOptionContract, ...currentContracts.option_contracts],
        option_change_history: [
          {
            changed_at: nowIso,
            option_name: optionMaster.name,
            action_type: 'add',
            notes:
              validationResult.data.apply_from === 'today'
                ? 'オプション追加（即時）'
                : 'オプション追加（翌月）',
          },
          ...currentContracts.option_change_history,
        ],
      },
    });

    return NextResponse.json(newOptionContract);
  } catch {
    return NextResponse.json({ error: 'Failed to add option contract' }, { status: 500 });
  }
}

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/contracts/option-contracts',
  summary: 'Get member option contracts',
  description: 'Get option contracts for a member',
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
      schema: GetOptionContractsResponseSchema,
      description: 'Member option contracts',
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const contracts = db.contracts.getByMemberId(id);
    if (!contracts) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    return NextResponse.json(contracts.option_contracts ?? []);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch option contracts' }, { status: 500 });
  }
}
