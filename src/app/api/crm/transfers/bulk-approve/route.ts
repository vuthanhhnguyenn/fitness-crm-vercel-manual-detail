import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import {
  canActOnTransfer,
  isTransferVisible,
  roleHasPermission,
  toTransferActor,
} from '@/app/api/_lib/transfer-permission';
import { db } from '@/app/api/_mock-db';
import {
  BulkApproveTransfersBodySchema,
  type BulkApproveTransfersResponse,
  BulkApproveTransfersResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

registerRoute({
  method: 'post',
  path: '/crm/transfers/bulk-approve',
  summary: 'Bulk approve eligible JOYFIT automatic transfers (A-02 FR-013)',
  description:
    'Approves many eligible JOYFIT transfers in one action. Every id is re-validated server-side (exists, in scope, JOYFIT, not excluded, approvable, actionable) and reported individually, so a partial success is returned rather than failing the whole batch. Requires members.transfers-bulk-approve (System / Headquarter / Manager).',
  tags: ['Transfers'],
  requestBody: { schema: BulkApproveTransfersBodySchema },
  responses: [
    {
      status: 200,
      schema: BulkApproveTransfersResponseSchema,
      description: 'Per-item outcomes',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid body - empty or over-long transfer_ids',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - lacks bulk-approve permission',
    },
  ],
});

export async function POST(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const user = authResult.user;

  if (!roleHasPermission(user, Permission.MembersTransfersBulkApprove)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allowed = getAllowedStoreIds(user);
  if (allowed !== null && allowed.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = BulkApproveTransfersBodySchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const { transfer_ids, comment } = validation.data;
  const approved: string[] = [];
  const failed: BulkApproveTransfersResponse['failed'] = [];

  // De-duplicate so a repeated id cannot be counted twice in the success toast.
  for (const id of new Set(transfer_ids)) {
    const transfer = db.transfers.getById(id);
    // Out-of-scope rows report the same message as missing ones — a bulk endpoint must not
    // become an existence oracle either.
    if (!transfer || !isTransferVisible(transfer, allowed)) {
      failed.push({ id, reason: '対象の移籍申請が見つかりません' });
      continue;
    }
    if (transfer.brand !== 'joyfit') {
      failed.push({ id, reason: '一括承認はJOYFITの自動移籍のみが対象です' });
      continue;
    }
    if (transfer.auto_transfer_eligible !== true) {
      failed.push({ id, reason: '自動移籍の除外理由があるため個別対応が必要です' });
      continue;
    }
    if (!canActOnTransfer(user, transfer)) {
      failed.push({ id, reason: 'この移籍申請を承認する権限がありません' });
      continue;
    }

    const result = db.transfers.approve(id, toTransferActor(user, transfer), comment);
    if (result.ok) {
      approved.push(id);
      continue;
    }
    const reason =
      result.reason === 'excluded'
        ? '自動移籍の除外理由があるため個別対応が必要です'
        : result.reason === 'terminal'
          ? 'すでに完了または否認されています'
          : '現在のステータスでは承認できません';
    failed.push({ id, reason });
  }

  const response: BulkApproveTransfersResponse = { approved, failed };
  return NextResponse.json(response, { status: 200 });
}
