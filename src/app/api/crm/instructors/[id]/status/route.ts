import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { UpdateInstructorStatusRequestSchema } from '@/app/api/_schemas/instructor.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveInstructorDataScope } from '@/lib/utils/instructor-permissions';

registerRoute({
  method: 'patch',
  path: '/crm/instructors/{id}/status',
  summary: 'Activate or deactivate instructor',
  description: 'Toggle instructor status (Headquarter/Manager/System only)',
  tags: ['Instructors'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Instructor ID',
    },
  ],
  requestBody: {
    schema: UpdateInstructorStatusRequestSchema,
    description: 'Status change payload',
  },
  responses: [
    { status: 200, description: 'Status updated' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Instructor not found' },
  ],
});

const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const allowedRoles: StaffRole[] = ['headquarter', 'manager', 'system'];
    if (!allowedRoles.includes(MOCK_ROLE)) {
      return NextResponse.json(
        { error: 'ステータス変更は本部・マネージャーのみ可能です' },
        { status: 403 },
      );
    }

    const scope = resolveInstructorDataScope(MOCK_ROLE, {});
    const existing = db.instructors.getDetail(id, scope);
    if (!existing) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateInstructorStatusRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.instructors.updateStatus(id, validationResult.data.status, MOCK_OPERATOR);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('PATCH /crm/instructors/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
