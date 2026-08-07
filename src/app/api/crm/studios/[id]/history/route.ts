import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import {
  type GetStudioHistoryResponse,
  GetStudioHistoryResponseSchema,
} from '@/app/api/_schemas/studio-detail.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';

registerRoute({
  method: 'get',
  path: '/crm/studios/{id}/history',
  summary: 'Get studio change history',
  description: 'Get the change-log entries for a studio detail page (newest-first)',
  tags: ['Studios'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Studio ID',
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetStudioHistoryResponseSchema,
      description: 'Studio change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Studio not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 });
    }

    const mockRole: StaffRole = 'headquarter';
    const mockStoreIds: string[] = [];
    const history = db.studios.getHistoryByStudioId(id, mockRole, mockStoreIds);

    if (!history) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const response: GetStudioHistoryResponse = { data: history };
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/crm/studios/[id]/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch studio history' }, { status: 500 });
  }
}
