import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { GetEntryExitLogQuickViewResponseSchema } from '@/app/api/_schemas/entry-exit-log.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/entry-exit-logs/{id}/quick-view',
  summary: 'Get Member Quick View for an entry-exit log row',
  description:
    'Get identity, contract, badges, contact info, and recent-visit history for the member behind a clicked activity row (B-01 FR-B01-05/06)',
  tags: ['Entry-Exit'],
  parameters: [{ name: 'id', in: 'path', required: true, description: 'Entry-exit log id' }],
  responses: [
    {
      status: 200,
      schema: GetEntryExitLogQuickViewResponseSchema,
      description: 'Member Quick View payload',
    },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Log row not found' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const allowedStoreIds = getAllowedStoreIds(authResult.user);
    if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = db.entryExitLogs.getQuickView(id, allowedStoreIds);

    if (!data) {
      return NextResponse.json({ error: 'Entry-exit log not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching entry-exit quick view:', error);
    return NextResponse.json({ error: 'Failed to fetch member quick view' }, { status: 500 });
  }
}
