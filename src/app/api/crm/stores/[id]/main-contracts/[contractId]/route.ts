import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RemoveStoreMainContractResponseSchema,
} from '@/app/api/_schemas/store-sales-settings.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/stores/{id}/main-contracts/{contractId}',
  summary: 'Remove main contract from store',
  description: '店舗から主契約の紐づけを解除する',
  tags: ['Stores'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'contractId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: [
    {
      status: 200,
      schema: RemoveStoreMainContractResponseSchema,
      description: 'Main contract unlinked',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> },
) {
  try {
    const { id, contractId } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    const removed = db.storeMainContracts.removeByStoreId(id, contractId);
    if (!removed) {
      return NextResponse.json({ error: '主契約が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ message: '主契約の紐づけを解除しました' });
  } catch (error) {
    console.error('Error removing main contract from store:', error);
    return NextResponse.json({ error: 'Failed to remove main contract' }, { status: 500 });
  }
}
