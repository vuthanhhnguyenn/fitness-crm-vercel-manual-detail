import { NextRequest, NextResponse } from 'next/server';

import { toPendingPlanChangeResponse } from '@/app/api/_lib/member-contract';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetMemberDetailResponse,
  GetMemberDetailResponseSchema,
  type UpdateMemberRequest,
  UpdateMemberRequestSchema,
  type UpdateMemberResponse,
  UpdateMemberResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}',
  summary: 'Get member detail',
  description: 'Get detailed information about a specific member',
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
      schema: GetMemberDetailResponseSchema,
      description: 'Member detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/members/{id}',
  summary: 'Update member detail',
  description: 'Update member detail (basic info, profile info)',
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
    schema: UpdateMemberRequestSchema,
    description: 'Member update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateMemberResponseSchema,
      description: 'Member updated successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // A-01 FR-013a: the pending plan change lives on the contract row, so the bundle picks it up
    // here — that way the head-up card and the 主契約 card read the same state.
    // `family` is derived from the relationship table rather than stored on the member
    // row, so it stays correct after members are added or removed (QA02 §2.1).
    const detail = {
      ...(member as GetMemberDetailResponse),
      family: db.members.buildFamilyBundle(id),
    };
    const pendingPlanChange = toPendingPlanChangeResponse(
      db.contracts.getByMemberId(id)?.main_contract.pending_plan_change,
    );
    if (pendingPlanChange && detail.currentMainContract) {
      return NextResponse.json({
        ...detail,
        currentMainContract: { ...detail.currentMainContract, pendingPlanChange },
      } satisfies GetMemberDetailResponse);
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Error fetching member detail:', error);
    return NextResponse.json({ error: 'Failed to fetch member detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateMemberRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateMemberRequest = validationResult.data;
    const member = db.members.update(id, validatedBody);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(member as UpdateMemberResponse);
  } catch (error) {
    console.error('Error updating member detail:', error);
    return NextResponse.json({ error: 'Failed to update member detail' }, { status: 500 });
  }
}
