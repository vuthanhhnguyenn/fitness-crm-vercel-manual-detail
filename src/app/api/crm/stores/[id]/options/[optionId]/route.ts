import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RemoveStoreOptionResponseSchema,
} from '@/app/api/_schemas/store-sales-settings.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/stores/{id}/options/{optionId}',
  summary: 'Remove option from store',
  description: '店舗からオプションの紐づけを解除する',
  tags: ['Stores'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'optionId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: [
    {
      status: 200,
      schema: RemoveStoreOptionResponseSchema,
      description: 'Option unlinked',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> },
) {
  try {
    const { id, optionId } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    const removed = db.storeOptions.removeByStoreId(id, optionId);
    if (!removed) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ message: 'オプションの紐づけを解除しました' });
  } catch (error) {
    console.error('Error removing option from store:', error);
    return NextResponse.json({ error: 'Failed to remove option' }, { status: 500 });
  }
}
