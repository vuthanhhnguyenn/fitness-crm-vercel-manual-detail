import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, GetLeaveDetailResponseSchema } from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/leaves/{id}',
  summary: 'Get leave/withdrawal request detail',
  description:
    'Full detail of a single suspension or withdrawal application, including the member head-up block and the derived suspension history. Readable in any status, including completed. An out-of-scope id returns 404 — existence is not disclosed.',
  tags: ['Leaves'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    { status: 200, schema: GetLeaveDetailResponseSchema, description: 'Leave request detail' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Leave request not found' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (authResult.user.role === 'Trainer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const leave = db.memberLeaves.getById(id);
  if (!leave) {
    return NextResponse.json({ error: '対象の申請が見つかりません。' }, { status: 404 });
  }

  // Out-of-scope rows are indistinguishable from missing ones (FR-083).
  const allowedStoreIds = getAllowedStoreIds(authResult.user);
  if (allowedStoreIds !== null && !allowedStoreIds.includes(leave.store_id)) {
    return NextResponse.json({ error: '対象の申請が見つかりません。' }, { status: 404 });
  }

  // Parsed on the way out, as the list handler does — a mock drifting from the schema
  // should fail here rather than reach the screen as a silently wrong shape.
  return NextResponse.json(GetLeaveDetailResponseSchema.parse({ leave }), { status: 200 });
}
