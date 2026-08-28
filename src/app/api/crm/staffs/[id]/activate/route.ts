import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ActivateStaffResponseSchema, ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/staffs/{id}/activate',
  summary: 'Reactivate a staff member',
  description: 'Sets status back to active, restoring login access (headquarters/system only)',
  tags: ['Staffs'],
  parameters: [
    { name: 'id', in: 'path', required: true, description: 'Staff ID', schema: { type: 'string' } },
  ],
  responses: [
    { status: 200, schema: ActivateStaffResponseSchema, description: 'Staff reactivated' },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - headquarters/system only',
    },
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
    if (caller.role !== 'System' && caller.role !== 'Headquarter') {
      return NextResponse.json({ error: 'スタッフの有効化は本部権限が必要です' }, { status: 403 });
    }

    const { id } = await params;
    const user = db.users.getById(caller.id);
    const updated = db.staffs.activate(id, {
      name: caller.name,
      position: user?.position ?? '',
    });

    if (!updated) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: 'スタッフを有効化しました', staff: updated });
  } catch (error) {
    console.error('Error activating staff:', error);
    return NextResponse.json({ error: 'スタッフの有効化に失敗しました' }, { status: 500 });
  }
}
