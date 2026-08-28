import { NextRequest, NextResponse } from 'next/server';

import { guardTransferRequest, toTransferDetailResponse } from '@/app/api/_lib/transfer-permission';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  UnlockTransferBodySchema,
  UnlockTransferResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

registerRoute({
  method: 'patch',
  path: '/crm/transfers/{id}/unlock',
  summary: 'Manually release an auto-transfer exclusion (A-02 FR-012)',
  description:
    'Releases the campaign / cancellation-fee lock so an excluded JOYFIT transfer may proceed, recording who did it and why. A co-present unpaid balance is NOT released — that has no override. Requires members.transfers-unlock (System / Headquarter / Manager).',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: UnlockTransferBodySchema },
  responses: [
    {
      status: 200,
      schema: UnlockTransferResponseSchema,
      description: 'Campaign lock released',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Empty / whitespace-only or over-long reason',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - lacks unlock permission',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Transfer request not found or out of scope',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'No campaign lock present on this transfer',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Row-level `canActOnTransfer` is not required here: unlocking is an administrative
  // override held only by System / Headquarter / Manager, none of which is side-scoped.
  const guard = guardTransferRequest(request, id, Permission.MembersTransfersUnlock, false);
  if (!guard.ok) return guard.response;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = UnlockTransferBodySchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const result = db.transfers.unlock(id, validation.data.reason, guard.user.name);

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
    }
    if (result.reason === 'no_campaign_lock') {
      return NextResponse.json(
        { error: 'この移籍申請には解除できる縛り期間の除外理由がありません' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Invalid state transition for unlock' }, { status: 400 });
  }

  return NextResponse.json(
    { transfer: toTransferDetailResponse(result.row, guard.user) },
    { status: 200 },
  );
}
