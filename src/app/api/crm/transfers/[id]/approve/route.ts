import { NextRequest, NextResponse } from 'next/server';

import {
  guardTransferRequest,
  toTransferActor,
  toTransferDetailResponse,
} from '@/app/api/_lib/transfer-permission';
import { db } from '@/app/api/_mock-db';
import {
  ApproveTransferBodySchema,
  ApproveTransferResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

registerRoute({
  method: 'patch',
  path: '/crm/transfers/{id}/approve',
  summary: 'Approve transfer request',
  description:
    'Approve a transfer at its current stage. JOYFIT completes immediately (auto-execution) and moves the member’s contracted store; FIT365 advances to the destination store’s approval. Requires members.transfers-approve plus row-level eligibility.',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ApproveTransferBodySchema },
  responses: [
    {
      status: 200,
      schema: ApproveTransferResponseSchema,
      description: 'Transfer request approved',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid body, terminal state, or invalid state transition',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - not permitted to act on this transfer',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Transfer request not found or out of scope',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Blocked by an unresolved auto-transfer exclusion',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const guard = guardTransferRequest(request, id, Permission.MembersTransfersApprove, true);
  if (!guard.ok) return guard.response;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = ApproveTransferBodySchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const result = db.transfers.approve(
    id,
    toTransferActor(guard.user, guard.transfer),
    validation.data.comment,
  );

  if (!result.ok) {
    // FR-006: an excluded JOYFIT row must not be approvable even when the UI is bypassed.
    if (result.reason === 'excluded') {
      return NextResponse.json(
        { error: '自動移籍の除外理由が解消されていないため承認できません' },
        { status: 409 },
      );
    }
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
    }
    if (result.reason === 'terminal') {
      return NextResponse.json(
        { error: 'すでに完了または否認された移籍申請は承認できません' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Invalid state transition for approve' }, { status: 400 });
  }

  return NextResponse.json(
    { transfer: toTransferDetailResponse(result.row, guard.user) },
    { status: 200 },
  );
}
