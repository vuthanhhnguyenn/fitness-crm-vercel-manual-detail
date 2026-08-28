import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, MagicLinkResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/staffs/{id}/magic-link',
  summary: 'Issue a magic login link',
  description:
    'Headquarters/system may issue for any account; any caller may issue for their own account (FR-020)',
  tags: ['Staffs'],
  parameters: [
    { name: 'id', in: 'path', required: true, description: 'Staff ID', schema: { type: 'string' } },
  ],
  responses: [
    { status: 200, schema: MagicLinkResponseSchema, description: 'Magic link issued' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Staff not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const caller = authResult.user;

    const { id } = await params;
    const existing = db.staffs.getDetailById(id);
    if (!existing) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    const isHq = caller.role === 'System' || caller.role === 'Headquarter';
    const isSelfAccount = Boolean(caller.staff_id) && caller.staff_id === existing.staff_id;
    if (!isHq && !isSelfAccount) {
      return NextResponse.json(
        { error: 'ログイン用URLの発行は本部権限、または本人のみ可能です' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      message: 'CRMのログイン用URLを送信しました',
      sent_to: existing.personal_info.email,
    });
  } catch (error) {
    console.error('Error issuing magic link:', error);
    return NextResponse.json({ error: 'ログイン用URLの発行に失敗しました' }, { status: 500 });
  }
}
