import { NextRequest, NextResponse } from 'next/server';

import { formatOperatorName, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type UnlinkFranchiseCompanyStoreResponse,
  UnlinkFranchiseCompanyStoreResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/franchise-companies/{id}/stores/{storeId}',
  summary: 'Unlink a store from an FC company',
  description: '解除 — removes a store from this FC company’s 管轄店舗.',
  tags: ['FranchiseCompanies'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'FC company ID',
      schema: { type: 'string' },
    },
    {
      name: 'storeId',
      in: 'path',
      required: true,
      description: 'Store internal ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: UnlinkFranchiseCompanyStoreResponseSchema, description: 'Unlinked' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; storeId: string }> },
) {
  try {
    const { id, storeId } = await context.params;
    if (!db.franchiseCompanies.getById(id)) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const store = db.stores.getById(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    if (store.fc_company_id !== id) {
      return NextResponse.json(
        { error: 'この店舗は指定されたFC企業に紐づいていません' },
        { status: 400 },
      );
    }

    db.stores.updateById(store.id, { fc_company_id: null });

    const authResult = getAuthUserFromRequest(request);
    const operator = authResult.ok ? formatOperatorName(authResult.user) : 'システム';
    db.franchiseCompanies.appendHistoryEntry(
      id,
      { changed_item: `店舗紐づけ解除: ${store.name}`, before: null, after: null },
      operator,
    );

    const response: UnlinkFranchiseCompanyStoreResponse = { message: '店舗の紐づけを解除しました' };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error unlinking store from franchise company:', error);
    return NextResponse.json({ error: 'Failed to unlink store' }, { status: 500 });
  }
}
