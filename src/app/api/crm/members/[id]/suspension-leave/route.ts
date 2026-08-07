import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetMemberActiveSuspensionResponseSchema,
} from '@/app/api/_schemas/leave.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/suspension-leave',
  summary: 'Get active suspension leave for a member',
  description:
    'Returns the current active suspension (休会中 or 休会予定) leave detail for a member, or null if none',
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
      schema: GetMemberActiveSuspensionResponseSchema,
      description: 'Active suspension detail (null when no active suspension)',
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const suspension = db.memberLeaves.getActiveSuspensionByMemberId(id) ?? null;

    return NextResponse.json({ suspension }, { status: 200 });
  } catch (error) {
    console.error('[GET /crm/members/[id]/suspension-leave]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
