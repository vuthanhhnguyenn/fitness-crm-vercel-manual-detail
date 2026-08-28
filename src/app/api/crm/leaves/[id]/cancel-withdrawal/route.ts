import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CancelWithdrawalRequestSchema,
  ErrorResponseSchema,
  LeaveActionResponseSchema,
} from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { ROLE_PERMISSIONS } from '@/constants/permission.constants';

import { Permission, UserRole } from '@/types/permission.type';

registerRoute({
  method: 'post',
  path: '/crm/leaves/{id}/cancel-withdrawal',
  summary: 'Cancel a scheduled withdrawal',
  description:
    'Cancels a scheduled withdrawal and returns the member to a normal state. Guard chain, in order: the withdrawal batch must not own the row (409), the application must be withdrawal_scheduled (409), and the usage start date must not have arrived (422). Not idempotent — repeating a successful cancellation returns 409.',
  tags: ['Leaves'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: CancelWithdrawalRequestSchema },
  responses: [
    { status: 200, schema: LeaveActionResponseSchema, description: 'Updated leave detail' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid request body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Role not permitted to cancel' },
    { status: 404, schema: ErrorResponseSchema, description: 'Leave not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Not a cancellable state' },
    { status: 422, schema: ErrorResponseSchema, description: 'Usage start date already passed' },
  ],
});

/**
 * A-03 権限マトリクス — 退会取り消し is ○ for System / Headquarter / Manager / Staff and × for
 * Trainer and Observer. The endpoint enforces it as well as the screens do: a disabled
 * button is not a permission check. Both sides read the same `members.withdraw` grant, so
 * the gate cannot drift between them.
 */
function canCancelWithdrawal(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].includes(Permission.MembersWithdraw);
}

/** User-facing messages, mirroring the two tooltips the screen shows (FR-047 / FR-048). */
const BLOCKED_MESSAGE = {
  not_cancellable_status: '退会処理が開始されているため取り消しできません。',
  batch_processing_started: '退会処理が開始されているため取り消しできません。',
  usage_started: '利用開始日以降のため取り消しできません。',
} as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // FR-002「取り消し実行者・実行日時を記録」 — the executor comes from the session, never
  // from the request body.
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (!canCancelWithdrawal(authResult.user.role as UserRole)) {
    return NextResponse.json({ error: '退会取り消しの権限がありません。' }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = CancelWithdrawalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const existing = db.memberLeaves.getById(id);
  if (!existing) {
    return NextResponse.json({ error: '対象の申請が見つかりません。' }, { status: 404 });
  }

  const result = db.memberLeaves.cancelWithdrawal(id, authResult.user.name);
  if (!result.ok) {
    return NextResponse.json(
      { error: BLOCKED_MESSAGE[result.reason] },
      { status: result.reason === 'usage_started' ? 422 : 409 },
    );
  }

  return NextResponse.json({ leave: result.leave }, { status: 200 });
}
