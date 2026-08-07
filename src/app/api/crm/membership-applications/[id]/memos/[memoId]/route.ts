import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

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
    {
      status: 200,
      schema: ErrorResponseSchema,
      description: 'Memo deleted successfully',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Application or memo not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// DELETE /api/crm/membership-applications/{id}/memos/{memoId} - メモ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> },
) {
  try {
    const { id, memoId } = await params;

    // Check if application exists
    const application = db.membershipApplications.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Membership application not found' }, { status: 404 });
    }

    // Delete memo
    const success = db.membershipApplications.deleteMemo(id, memoId);

    if (!success) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Memo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting memo:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
