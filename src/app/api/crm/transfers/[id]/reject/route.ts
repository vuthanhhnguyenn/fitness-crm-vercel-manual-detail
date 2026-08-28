import { NextRequest, NextResponse } from 'next/server';

import {
  guardTransferRequest,
  toTransferActor,
  toTransferDetailResponse,
} from '@/app/api/_lib/transfer-permission';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RejectTransferBodySchema,
  RejectTransferResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

registerRoute({
  method: 'patch',
  path: '/crm/transfers/{id}/reject',
  summary: 'Reject transfer request',
  description:
    'Reject a transfer at its current stage. The case closes and the applicant is notified. The optional comment is persisted as a decision record. Requires members.transfers-approve plus row-level eligibility.',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: RejectTransferBodySchema },
  responses: [
    {
      status: 200,
      schema: RejectTransferResponseSchema,
      description: 'Transfer request rejected',
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

  const validation = RejectTransferBodySchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const result = db.transfers.reject(
    id,
    toTransferActor(guard.user, guard.transfer),
    validation.data.comment,
  );

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
    }
    if (result.reason === 'terminal') {
      return NextResponse.json(
        { error: 'すでに完了または否認された移籍申請は否認できません' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Invalid state transition for reject' }, { status: 400 });
  }

  return NextResponse.json(
    { transfer: toTransferDetailResponse(result.row, guard.user) },
    { status: 200 },
  );
}
