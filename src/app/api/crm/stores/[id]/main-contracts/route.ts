import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  AddStoreMainContractsRequestSchema,
  AddStoreMainContractsResponseSchema,
  ErrorResponseSchema,
  GetStoreMainContractsResponseSchema,
} from '@/app/api/_schemas/store-sales-settings.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{id}/main-contracts',
  summary: 'List main contracts by store',
  description: '店舗に紐づく主契約一覧を取得する',
  tags: ['Stores'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    {
      status: 200,
      schema: GetStoreMainContractsResponseSchema,
      description: 'Store main contracts',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/stores/{id}/main-contracts',
  summary: 'Add main contracts into store',
  description: '店舗に主契約を紐づける',
  tags: ['Stores'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: {
    schema: AddStoreMainContractsRequestSchema,
    description: 'Main contract IDs to link',
  },
  responses: [
    {
      status: 200,
      schema: AddStoreMainContractsResponseSchema,
      description: 'Linked main contracts',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ main_contracts: db.storeMainContracts.listByStoreId(id) });
  } catch (error) {
    console.error('Error fetching store main contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch store main contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    const body = await request.json();
    const parsed = AddStoreMainContractsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const main_contracts = db.storeMainContracts.addByStoreId(id, parsed.data.main_contract_ids);
    return NextResponse.json({ message: '主契約を紐づけました', main_contracts });
  } catch (error) {
    console.error('Error linking main contracts into store:', error);
    return NextResponse.json({ error: 'Failed to link main contracts' }, { status: 500 });
  }
}
