import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeletePersonalDataRequestSchema,
  DeletePersonalDataResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { MemberStatus } from '@/lib/api/types.gen';

// A-01 FR-018. POST rather than DELETE: the operation requires a body (削除理由 + the typed
// confirmation literal), and a request body on DELETE is not reliably transmitted. This also
// mirrors the backend design doc's `POST /members/{memberId}/anonymize`, so the Phase 2
// switch is a URL change only.
registerRoute({
  method: 'post',
  path: '/crm/members/{id}/personal-data/anonymize',
  summary: 'Anonymise member personal data',
  description:
    'Replace PII fields (name, address, contact info) with dummy values. Cannot be undone. Requires a reason and a typed confirmation. Blocked when the member is blacklisted, has unpaid fees, is already anonymised, or is not withdrawn (A-01 FR-018).',
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
    schema: DeletePersonalDataRequestSchema,
    description: 'Deletion reason and typed confirmation',
  },
  responses: [
    {
      status: 200,
      schema: DeletePersonalDataResponseSchema,
      description: 'Personal data anonymised successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error — missing reason or confirmation mismatch',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Already anonymised',
    },
    {
      status: 422,
      schema: ErrorResponseSchema,
      description:
        'Blocked — member is blacklisted, has unpaid fees, or is not in a withdrawn state',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

const ANONYMIZABLE_STATUSES: string[] = [MemberStatus.WITHDRAWN, MemberStatus.FORCED_WITHDRAWAL];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = DeletePersonalDataRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    if (member.anonymizedAt) {
      return NextResponse.json({ error: '既に個人情報が削除されています' }, { status: 409 });
    }

    if (!ANONYMIZABLE_STATUSES.includes(member.memberStatus)) {
      return NextResponse.json({ error: '退会済みの会員のみ削除できます' }, { status: 422 });
    }

    // A-01 FR-018: blacklisted members and members with unpaid fees cannot be anonymised
    const isBlacklisted = Boolean(member.blacklist?.isActive);
    const hasUnpaidFee = member.constraints.hasUnpaidFee || member.unpaidAmount > 0;

    if (isBlacklisted || hasUnpaidFee) {
      const error =
        isBlacklisted && hasUnpaidFee
          ? 'ブラックリスト登録者かつ未納金があるため削除できません'
          : isBlacklisted
            ? 'ブラックリスト登録者のため削除できません'
            : '未納金があるため削除できません';

      return NextResponse.json({ error }, { status: 422 });
    }

    db.members.anonymizePersonalData(id);

    return NextResponse.json({
      success: true,
      member_id: id,
      message: '個人情報を削除しました',
    });
  } catch (error) {
    console.error('Error anonymising personal data:', error);
    return NextResponse.json({ error: 'Failed to anonymise personal data' }, { status: 500 });
  }
}
