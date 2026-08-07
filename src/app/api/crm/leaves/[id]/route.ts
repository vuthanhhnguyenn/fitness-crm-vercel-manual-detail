import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, GetLeaveDetailResponseSchema } from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/leaves/{id}',
  summary: 'Get leave/withdrawal request detail',
  description: 'Get full detail of a single leave or withdrawal request',
  tags: ['Leaves'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetLeaveDetailResponseSchema,
      description: 'Leave request detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Leave request not found',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const leave = db.memberLeaves.getById(id);
  if (!leave) {
    return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
  }

  return NextResponse.json({ leave }, { status: 200 });
}
