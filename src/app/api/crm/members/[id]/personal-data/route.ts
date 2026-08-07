import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeletePersonalDataResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/members/{id}/personal-data',
  summary: 'Anonymise member personal data',
  description:
    'Replace PII fields (name, address, contact info) with dummy values. Cannot be undone. Blocked if member is blacklisted.',
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
      schema: DeletePersonalDataResponseSchema,
      description: 'Personal data anonymised successfully',
    },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Blocked — member is on the blacklist',
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.profile.is_black_listed) {
      return NextResponse.json(
        { error: 'ブラックリスト登録者のため削除できません' },
        { status: 403 },
      );
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
