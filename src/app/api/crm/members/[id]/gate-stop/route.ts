import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GateStopReleaseRequestSchema,
  GateStopReleaseResponseSchema,
  GateStopRequestSchema,
  GateStopResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

registerRoute({
  method: 'post',
  path: '/crm/members/{id}/gate-stop',
  summary: 'Set gate stop for a member',
  description: 'Restrict member entry at gate terminals (ゲートストップ設定)',
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
    schema: GateStopRequestSchema,
    description: 'Gate stop request payload',
  },
  responses: [
    { status: 200, schema: GateStopResponseSchema, description: 'Gate stop applied successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Member not found' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Member is not in a state that allows gate stop',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// ── DELETE (release gate stop) ────────────────────────────────────────────────
registerRoute({
  method: 'delete',
  path: '/crm/members/{id}/gate-stop',
  summary: 'Release gate stop for a member',
  description: 'Remove gate stop restriction and restore member access (ゲートストップ解除)',
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
    schema: GateStopReleaseRequestSchema,
    description: 'Gate stop release request payload',
  },
  responses: [
    {
      status: 200,
      schema: GateStopReleaseResponseSchema,
      description: 'Gate stop released successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Member not found' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Member is not currently gate-stopped',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

const GATE_STOP_ALLOWED_STATUSES: string[] = [
  MemberStatus.ACTIVE,
  MemberStatus.SUSPENDED,
  MemberStatus.PENDING_WITHDRAWAL,
];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!GATE_STOP_ALLOWED_STATUSES.includes(member.profile.status)) {
      return NextResponse.json(
        { error: 'Member is not in a state that allows gate stop' },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validationResult = GateStopRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { scope, reason, terminal_message, lock_after_message } = validationResult.data;

    const result = db.members.setGateStop({
      id,
      scope,
      reason,
      terminal_message,
      lock_after_message,
    });
    if (!result) {
      return NextResponse.json({ error: 'Failed to apply gate stop' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member_id: id, scope, reason }, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/gate-stop]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.profile.status !== MemberStatus.GATE_STOP) {
      return NextResponse.json({ error: 'Member is not currently gate-stopped' }, { status: 409 });
    }

    const body = await request.json();
    const validationResult = GateStopReleaseRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.members.releaseGateStop(id);
    if (!result) {
      return NextResponse.json({ error: 'Failed to release gate stop' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member_id: id }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /crm/members/[id]/gate-stop]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
