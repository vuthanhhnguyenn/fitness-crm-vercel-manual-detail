import { NextRequest, NextResponse } from 'next/server';

import { guardTransferRequest, toTransferDetailResponse } from '@/app/api/_lib/transfer-permission';
import {
  ErrorResponseSchema,
  GetTransferDetailResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { Permission } from '@/types/permission.type';

registerRoute({
  method: 'get',
  path: '/crm/transfers/{id}',
  summary: 'Get transfer request detail',
  description:
    'Get full detail of a single transfer request including approval history, decisions and unlock audit. Returns 404 when the row is outside the caller’s store scope, so existence is not leaked.',
  tags: ['Transfers'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetTransferDetailResponseSchema,
      description: 'Transfer request detail',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden - no accessible stores' },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Transfer request not found or out of scope',
    },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const guard = guardTransferRequest(request, id, Permission.MembersTransfersView, false);
  if (!guard.ok) return guard.response;

  return NextResponse.json(
    { transfer: toTransferDetailResponse(guard.transfer, guard.user) },
    { status: 200 },
  );
}
