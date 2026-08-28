import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CreateMemoRequestSchema,
  CreateMemoResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for POST route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/memos',
  summary: 'Add memo to membership application',
  description: 'Add a new memo to the activity timeline of a membership application',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: { schema: CreateMemoRequestSchema },
  responses: [
    { status: 200, schema: CreateMemoResponseSchema, description: 'Memo created successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request - invalid body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// POST /api/crm/membership-applications/{id}/memos - メモ追加
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    // Memos require only View — Observer reaches them by design (FR-063).
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsView])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const { id } = await params;
    const body: unknown = await request.json();
    const validationResult = CreateMemoRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const { content } = validationResult.data;
    // Whitespace-only content is rejected — the client also disables the
    // add action for the same condition.
    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Memo content must not be blank' }, { status: 400 });
    }

    const timeline = db.membershipApplications.addMemo(
      id,
      content,
      authResult.user.name,
      allowedStoreIds,
    );

    if (timeline === 'not_found') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ timeline }, { status: 200 });
  } catch (error) {
    console.error('Error adding memo:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
