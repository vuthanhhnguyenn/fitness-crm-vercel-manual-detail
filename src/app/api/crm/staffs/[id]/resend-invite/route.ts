import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, ResendInviteResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/staffs/{id}/resend-invite',
  summary: 'Resend an invitation email',
  description: 'Refreshes invited_at for an invited staff account (headquarters/system only)',
  tags: ['Staffs'],
  parameters: [
    { name: 'id', in: 'path', required: true, description: 'Staff ID', schema: { type: 'string' } },
  ],
  responses: [
    { status: 200, schema: ResendInviteResponseSchema, description: 'Invitation resent' },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - headquarters/system only',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Staff not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Staff is not in invited status' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: '招待の再送は本部権限が必要です' }, { status: 403 });
    }

    const { id } = await params;
    const existing = db.staffs.getDetailById(id);
    if (!existing) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }
    if (existing.status !== 'invited') {
      return NextResponse.json({ error: '招待中のスタッフのみ再招待できます' }, { status: 409 });
    }

    db.staffs.resendInvite(id);

    return NextResponse.json({ message: '招待メールを再送しました' });
  } catch (error) {
    console.error('Error resending invite:', error);
    return NextResponse.json({ error: '招待の再送に失敗しました' }, { status: 500 });
  }
}
