import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  PenaltyReleaseRequestSchema,
  PenaltyReleaseResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/penalty-release',
  summary: 'Release a member reservation penalty',
  description: 'Release an active reservation penalty (予約ペナルティ解除) for a member',
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
  requestBody: {
    schema: PenaltyReleaseRequestSchema,
    description: 'Penalty-release payload',
  },
  responses: [
    {
      status: 200,
      schema: PenaltyReleaseResponseSchema,
      description: 'Penalty released',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = PenaltyReleaseRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    member.activePenalty = null;

    const responseData = PenaltyReleaseResponseSchema.parse({
      success: true,
      member_id: id,
    });

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/penalty-release]', error);
    return NextResponse.json({ error: 'Failed to release penalty' }, { status: 500 });
  }
}
