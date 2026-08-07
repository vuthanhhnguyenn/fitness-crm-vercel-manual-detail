import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ApproveTransferBodySchema,
  ApproveTransferResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/transfers/{id}/approve',
  summary: 'Approve transfer request',
  description: 'Approve a pending or from_store_approved transfer request',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ApproveTransferBodySchema },
  responses: [
    {
      status: 200,
      schema: ApproveTransferResponseSchema,
      description: 'Transfer request approved',
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

  const validation = ApproveTransferBodySchema.safeParse(body);
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
      { error: 'Cannot approve a transfer that is already completed or rejected' },
      { status: 400 },
    );
  }

  const updated = db.transfers.approve(id, validation.data.comment);
  if (!updated) {
    return NextResponse.json({ error: 'Invalid state transition for approve' }, { status: 400 });
  }

  return NextResponse.json({ transfer: updated }, { status: 200 });
}
