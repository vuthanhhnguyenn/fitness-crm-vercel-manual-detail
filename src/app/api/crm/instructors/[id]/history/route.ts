import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetInstructorHistoryResponseSchema } from '@/app/api/_schemas/instructor.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveInstructorDataScope } from '@/lib/utils/instructor-permissions';

registerRoute({
  method: 'get',
  path: '/crm/instructors/{id}/history',
  summary: 'Get instructor change history',
  description: 'Get the field-level change-log entries for an instructor (newest-first)',
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
  responses: [
    {
      status: 200,
      schema: GetInstructorHistoryResponseSchema,
      description: 'Instructor change history',
    },
    { status: 404, description: 'Instructor not found' },
    { status: 500, description: 'Internal server error' },
  ],
});

const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const scope = resolveInstructorDataScope(MOCK_ROLE, {});
    const history = db.instructors.getHistory(id, scope);
    if (!history) {
      return NextResponse.json(
        { message: 'NOT_FOUND', error: 'Instructor not found' },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json(history);
  } catch (error) {
    console.error('GET /crm/instructors/[id]/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch instructor history' }, { status: 500 });
  }
}
