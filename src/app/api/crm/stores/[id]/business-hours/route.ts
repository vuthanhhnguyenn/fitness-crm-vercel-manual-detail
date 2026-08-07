import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetStoreBusinessHoursResponseSchema,
  UpdateStoreBusinessHoursPayloadSchema,
  UpdateStoreBusinessHoursResponseSchema,
} from '@/app/api/_schemas/store.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{id}/business-hours',
  summary: 'Get store business hours',
  description: '店舗の営業時間設定（デフォルト・例外・臨時休業）を取得する',
  tags: ['Stores'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Store ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetStoreBusinessHoursResponseSchema, description: 'Business hours' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/stores/{id}/business-hours',
  summary: 'Update store business hours',
  description: '店舗の営業時間設定を更新する',
  tags: ['Stores'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Store ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateStoreBusinessHoursPayloadSchema,
    description: 'Business hours update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateStoreBusinessHoursResponseSchema,
      description: 'Business hours updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    const businessHours = db.businessHours.getByStoreId(id);
    if (!businessHours) {
      return NextResponse.json({ error: '営業時間情報が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ business_hours: businessHours });
  } catch (error) {
    console.error('Error getting store business hours:', error);
    return NextResponse.json({ error: 'Failed to get business hours' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    const body = await request.json();
    const parsed = UpdateStoreBusinessHoursPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const updated = db.businessHours.upsert(id, {
      ...parsed.data,
      updated_by: 'current-user',
    });
    return NextResponse.json({ message: '営業時間を更新しました', business_hours: updated });
  } catch (error) {
    console.error('Error updating store business hours:', error);
    return NextResponse.json({ error: 'Failed to update business hours' }, { status: 500 });
  }
}
