import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  AddStoreOptionsRequestSchema,
  AddStoreOptionsResponseSchema,
  ErrorResponseSchema,
  GetStoreOptionsResponseSchema,
} from '@/app/api/_schemas/store-sales-settings.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{id}/options',
  summary: 'List options by store',
  description: '店舗に紐づくオプション一覧を取得する',
  tags: ['Stores'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    { status: 200, schema: GetStoreOptionsResponseSchema, description: 'Store options' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/stores/{id}/options',
  summary: 'Add options into store',
  description: '店舗にオプションを紐づける',
  tags: ['Stores'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: {
    schema: AddStoreOptionsRequestSchema,
    description: 'Option IDs to link',
  },
  responses: [
    { status: 200, schema: AddStoreOptionsResponseSchema, description: 'Linked options' },
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
    return NextResponse.json({ options: db.storeOptions.listByStoreId(id) });
  } catch (error) {
    console.error('Error fetching store options:', error);
    return NextResponse.json({ error: 'Failed to fetch store options' }, { status: 500 });
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
    const parsed = AddStoreOptionsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const options = db.storeOptions.addByStoreId(id, parsed.data.option_ids);
    return NextResponse.json({ message: 'オプションを紐づけました', options });
  } catch (error) {
    console.error('Error linking options into store:', error);
    return NextResponse.json({ error: 'Failed to link options' }, { status: 500 });
  }
}
