import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateInstructorRequestSchema,
  GetInstructorDetailResponseSchema,
} from '@/app/api/_schemas/instructor.schema';
import {
  GetInstructorsQuerySchema,
  GetInstructorsResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import {
  canPerformInstructorAction,
  resolveInstructorDataScope,
} from '@/lib/utils/instructor-permissions';

registerRoute({
  method: 'get',
  path: '/crm/instructors',
  summary: 'List instructors',
  description:
    'Get instructor list, optionally filtered by store, role, tab, search, brand, or status (D-04 extends the D-01 picker additively)',
  tags: ['LessonSchedules', 'Instructors'],
  query: GetInstructorsQuerySchema,
  responses: [
    { status: 200, schema: GetInstructorsResponseSchema, description: 'Instructor list' },
    { status: 500, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/instructors',
  summary: 'Register a new instructor',
  description: 'Create a new instructor profile',
  tags: ['Instructors'],
  requestBody: {
    schema: CreateInstructorRequestSchema,
    description: 'Instructor create payload',
  },
  responses: [
    { status: 201, schema: GetInstructorDetailResponseSchema, description: 'Instructor created' },
    { status: 400, description: 'Bad request - validation error' },
    { status: 403, description: 'Forbidden' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetInstructorsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    // Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
    const mockRole: StaffRole = 'headquarter';
    const scope = resolveInstructorDataScope(mockRole, {});

    const response = db.instructors.listForCrm(validationResult.data, scope);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/instructors error:', error);
    return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Phase 1 mock: role check wired to a hardcoded caller (real auth context in Phase 2).
    const mockRole: StaffRole = 'headquarter';
    if (!canPerformInstructorAction(mockRole, 'register')) {
      return NextResponse.json(
        { error: 'You do not have permission to register instructors' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = CreateInstructorRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const fieldName = firstIssue?.path.join('.') || 'field';
      return NextResponse.json({ error: `${fieldName} is required` }, { status: 400 });
    }

    const mockOperator = '本部 佐藤';
    const created = db.instructors.create(validationResult.data, mockOperator);
    const detail = db.instructors.getDetail(created.instructor_id, () => true);
    return NextResponse.json(detail, { status: 201 });
  } catch (error) {
    console.error('POST /crm/instructors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
