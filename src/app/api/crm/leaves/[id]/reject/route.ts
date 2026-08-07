import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  LeaveActionResponseSchema,
  RejectLeaveRequestSchema,
} from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/leaves/{id}/reject',
  summary: 'Reject a leave/withdrawal request',
  description: 'Reject a pending suspension or withdrawal request, reverting the member to active',
  tags: ['Leaves'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: RejectLeaveRequestSchema },
  responses: [
    { status: 200, schema: LeaveActionResponseSchema, description: 'Updated leave detail' },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid transition or missing reason',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Leave not found' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = RejectLeaveRequestSchema.safeParse(body);
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

  const leave = db.memberLeaves.reject(id, parsed.data.reason);
  if (!leave) {
    return NextResponse.json(
      { error: `Cannot reject leave with status: ${existing.status}` },
      { status: 400 },
    );
  }

  return NextResponse.json({ leave }, { status: 200 });
}
