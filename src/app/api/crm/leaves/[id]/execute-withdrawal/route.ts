import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  ExecuteWithdrawalRequestSchema,
  LeaveActionResponseSchema,
} from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/leaves/{id}/execute-withdrawal',
  summary: 'Manually execute a withdrawal',
  description:
    'Manually execute a withdrawal for a withdrawal_pending leave request, completing the process',
  tags: ['Leaves'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ExecuteWithdrawalRequestSchema },
  responses: [
    { status: 200, schema: LeaveActionResponseSchema, description: 'Updated leave detail' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid transition' },
    { status: 404, schema: ErrorResponseSchema, description: 'Leave not found' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = ExecuteWithdrawalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const existing = db.memberLeaves.getById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
  }

  const leave = db.memberLeaves.executeWithdrawal(id, parsed.data.comment);
  if (!leave) {
    return NextResponse.json(
      { error: `Cannot execute withdrawal with status: ${existing.status}` },
      { status: 400 },
    );
  }

  return NextResponse.json({ leave }, { status: 200 });
}
