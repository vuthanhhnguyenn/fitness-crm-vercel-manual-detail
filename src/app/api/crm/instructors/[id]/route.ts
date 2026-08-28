import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  GetInstructorDetailResponseSchema,
  UpdateInstructorRequestSchema,
} from '@/app/api/_schemas/instructor.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import {
  canPerformInstructorAction,
  getEditableFields,
  resolveInstructorDataScope,
} from '@/lib/utils/instructor-permissions';

registerRoute({
  method: 'get',
  path: '/crm/instructors/{id}',
  summary: 'Get instructor detail',
  description:
    'Get full instructor profile including performance summary, assigned lessons, and upcoming schedule',
  tags: ['Instructors'],
  responses: [
    { status: 200, schema: GetInstructorDetailResponseSchema, description: 'Instructor detail' },
    { status: 404, description: 'Instructor not found' },
    { status: 500, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'put',
  path: '/crm/instructors/{id}',
  summary: 'Update instructor',
  description: 'Update an existing instructor profile (role-scoped field editability enforced)',
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
  requestBody: { schema: UpdateInstructorRequestSchema, description: 'Instructor update payload' },
  responses: [
    { status: 200, schema: GetInstructorDetailResponseSchema, description: 'Instructor updated' },
    { status: 400, description: 'Bad request - validation error' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Instructor not found' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/instructors/{id}',
  summary: 'Delete instructor',
  description: 'Delete an instructor; blocked while any schedule is assigned',
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
    { status: 204, description: 'Instructor deleted' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Instructor not found' },
    { status: 409, description: 'Instructor has assigned schedules' },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';
const MOCK_OPERATOR = '本部 佐藤';
const MOCK_CALLER_INSTRUCTOR_ID: string | undefined = undefined;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const scope = resolveInstructorDataScope(MOCK_ROLE, {
      callerInstructorId: MOCK_CALLER_INSTRUCTOR_ID,
    });
    const detail = db.instructors.getDetail(id, scope);
    if (!detail) {
      return NextResponse.json(
        { message: 'NOT_FOUND', error: 'Instructor not found' },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error('GET /crm/instructors/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch instructor detail' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isSelf = MOCK_CALLER_INSTRUCTOR_ID === id;

    if (!canPerformInstructorAction(MOCK_ROLE, 'edit', { isSelf })) {
      return NextResponse.json({ error: '編集権限がありません' }, { status: 403 });
    }

    const scope = resolveInstructorDataScope(MOCK_ROLE, {
      callerInstructorId: MOCK_CALLER_INSTRUCTOR_ID,
    });
    const existing = db.instructors.getDetail(id, scope);
    if (!existing) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    const body = await request.json();
    if (typeof body === 'object' && body !== null && 'status' in body) {
      return NextResponse.json(
        { error: 'status must be changed via the status endpoint' },
        { status: 400 },
      );
    }

    const validationResult = UpdateInstructorRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const editableFields = getEditableFields(MOCK_ROLE, isSelf);
    const patch: Partial<typeof validationResult.data> =
      editableFields === 'all'
        ? validationResult.data
        : Object.fromEntries(
            Object.entries(validationResult.data).filter(([key]) =>
              (editableFields as string[]).includes(key),
            ),
          );

    const effectiveLastName = patch.last_name ?? existing.data.last_name;
    const effectiveFirstName = patch.first_name ?? existing.data.first_name;
    const effectiveRoles = patch.role_classifications ?? existing.data.role_classifications;
    if (!effectiveLastName || effectiveLastName.trim().length === 0) {
      return NextResponse.json({ error: 'last_name is required' }, { status: 400 });
    }
    if (!effectiveFirstName || effectiveFirstName.trim().length === 0) {
      return NextResponse.json({ error: 'first_name is required' }, { status: 400 });
    }
    if (!effectiveRoles || effectiveRoles.length === 0) {
      return NextResponse.json({ error: 'role_classifications is required' }, { status: 400 });
    }

    const result = db.instructors.update(id, patch, MOCK_OPERATOR, scope);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    const detail = db.instructors.getDetail(id, scope);
    return NextResponse.json(detail);
  } catch (error) {
    console.error('PUT /crm/instructors/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!canPerformInstructorAction(MOCK_ROLE, 'delete')) {
      return NextResponse.json({ error: '削除権限がありません' }, { status: 403 });
    }

    const scope = resolveInstructorDataScope(MOCK_ROLE, {
      callerInstructorId: MOCK_CALLER_INSTRUCTOR_ID,
    });
    const existing = db.instructors.getDetail(id, scope);
    if (!existing) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    const result = db.instructors.delete(id);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }
    if (result === 'in_use') {
      return NextResponse.json(
        {
          error: `Cannot delete: instructor has ${existing.data.assigned_schedule_count} assigned schedule(s)`,
        },
        { status: 409 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /crm/instructors/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
