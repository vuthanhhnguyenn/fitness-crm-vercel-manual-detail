import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RejectTransferBodySchema,
  RejectTransferResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/transfers/{id}/reject',
  summary: 'Reject transfer request',
  description: 'Reject a pending or from_store_approved transfer request',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: RejectTransferBodySchema },
  responses: [
    {
      status: 200,
      schema: RejectTransferResponseSchema,
      description: 'Transfer request rejected',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid state transition',
    },
    {
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - insufficient permissions',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Transfer request not found',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = RejectTransferBodySchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const transfer = db.transfers.getById(id);
  if (!transfer) {
    return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
  }

  if (transfer.status === 'completed' || transfer.status === 'rejected') {
    return NextResponse.json(
      { error: 'Cannot reject a transfer that is already completed or rejected' },
      { status: 400 },
    );
  }

  const updated = db.transfers.reject(id, validation.data.comment);
  if (!updated) {
    return NextResponse.json({ error: 'Invalid state transition for reject' }, { status: 400 });
  }

  return NextResponse.json({ transfer: updated }, { status: 200 });
}
