import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetTransferDetailResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/transfers/{id}',
  summary: 'Get transfer request detail',
  description: 'Get full detail of a single transfer request including approval history',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetTransferDetailResponseSchema,
      description: 'Transfer request detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Transfer request not found',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const transfer = db.transfers.getById(id);
  if (!transfer) {
    return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
  }

  return NextResponse.json({ transfer }, { status: 200 });
}
