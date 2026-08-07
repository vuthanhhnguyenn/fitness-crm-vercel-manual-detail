import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetOptionMasterChangeHistoryResponseSchema,
} from '@/app/api/_schemas/option-master.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/options/{id}/change-history',
  summary: 'Get option master change history',
  description: 'Get change history for a specific option master',
  tags: ['Options'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Option ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetOptionMasterChangeHistoryResponseSchema,
      description: 'Option change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = db.optionMasters.getById(id);

    if (!detail) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    return NextResponse.json({ history: db.optionMasters.getChangeHistory(id) }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/options/[id]/change-history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
