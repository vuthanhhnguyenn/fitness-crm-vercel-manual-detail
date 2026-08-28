import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  DeleteMemoResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, UserRole } from '@/types/permission.type';

// Register OpenAPI documentation for DELETE route
registerRoute({
  method: 'delete',
  path: '/crm/membership-applications/{id}/memos/{memoId}',
  summary: 'Delete memo from membership application',
  description: 'Delete a memo from the activity timeline of a membership application',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
    {
      name: 'memoId',
      in: 'path',
      required: true,
      description: 'Memo ID to delete',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: DeleteMemoResponseSchema, description: 'Memo deleted successfully' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Application or memo not found' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'The target entry is a system record and cannot be deleted',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

// DELETE /api/crm/membership-applications/{id}/memos/{memoId} - メモ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsView])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);

    const { id, memoId } = await params;
    const timeline = db.membershipApplications.deleteMemo(id, memoId, allowedStoreIds);

    if (timeline === 'not_found') {
      return NextResponse.json({ error: 'Application or memo not found' }, { status: 404 });
    }
    if (timeline === 'not_a_memo') {
      return NextResponse.json({ error: 'System records cannot be deleted' }, { status: 409 });
    }

    return NextResponse.json({ timeline }, { status: 200 });
  } catch (error) {
    console.error('Error deleting memo:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
