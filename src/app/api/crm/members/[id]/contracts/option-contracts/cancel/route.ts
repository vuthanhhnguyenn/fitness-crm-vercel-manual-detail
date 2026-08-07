import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CancelOptionContractRequest,
  CancelOptionContractRequestSchema,
  CancelOptionContractResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/members/{id}/contracts/option-contracts/cancel',
  summary: 'Cancel member option contract',
  description: 'Cancel one option contract for a member',
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
    schema: CancelOptionContractRequestSchema,
    description: 'Option cancel payload',
  },
  responses: [
    {
      status: 200,
      schema: CancelOptionContractResponseSchema,
      description: 'Cancelled option contract',
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = CancelOptionContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const validatedBody: CancelOptionContractRequest = validationResult.data;

    const currentContracts = db.contracts.getByMemberId(id);
    if (!currentContracts) {
      return NextResponse.json({ error: 'Contracts not found' }, { status: 404 });
    }

    const cancelledOption = currentContracts.option_contracts.find(
      (option) => option.id === validatedBody.option_id,
    );
    if (!cancelledOption) {
      return NextResponse.json({ error: 'Option contract not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const remainingOptions = currentContracts.option_contracts.filter(
      (option) => option.id !== validatedBody.option_id,
    );
    const timingLabel = validatedBody.cancel_timing === 'immediate' ? '即時解約' : '翌月末解約';
    const reasonLabel = validatedBody.reason?.trim();

    db.contracts.create({
      contract_id: member.profile.contract_id || `CONTRACT-${id}`,
      member_id: id,
      data: {
        ...currentContracts,
        option_contracts: remainingOptions,
        option_change_history: [
          {
            changed_at: now,
            option_name: cancelledOption.name,
            action_type: 'remove',
            notes: reasonLabel ? `${timingLabel}: ${reasonLabel}` : timingLabel,
          },
          ...currentContracts.option_change_history,
        ],
      },
    });

    return NextResponse.json({
      cancelled_option_id: validatedBody.option_id,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel option contract' }, { status: 500 });
  }
}
