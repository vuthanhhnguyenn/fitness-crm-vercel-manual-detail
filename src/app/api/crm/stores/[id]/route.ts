import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetStoreByIdResponseSchema,
  UpdateStoreResponseSchema,
  UpsertStorePayloadSchema,
} from '@/app/api/_schemas/store.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

registerRoute({
  method: 'get',
  path: '/crm/stores/{id}',
  summary: 'Get store detail',
  description: 'Get store detail by id',
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
    { status: 200, schema: GetStoreByIdResponseSchema, description: 'Store detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/stores/{id}',
  summary: 'Update store detail',
  description: 'Update store by id',
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
    schema: UpsertStorePayloadSchema,
    description: 'Store update payload',
  },
  responses: [
    { status: 200, schema: UpdateStoreResponseSchema, description: 'Store updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(_request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const allowedStoreIds = getAllowedStoreIds(authResult.user);
    if (allowedStoreIds !== null && !allowedStoreIds.includes(id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const store = db.stores.getById(id);
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error getting store detail:', error);
    return NextResponse.json({ error: 'Failed to get store detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpsertStorePayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const payload = validationResult.data;
    const patch = omitUndefined({
      club_code: payload.club_code,
      name: payload.name,
      brand: payload.brand,
      area: payload.area,
      operating_company_name: payload.operating_company_name,
      status: payload.status,
      fc_company_id: payload.is_fc !== undefined ? (payload.is_fc ? 'fc-001' : null) : undefined,
      postal_code: payload.postal_code,
      prefecture: payload.prefecture,
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      accounting_code: payload.accounting_code,
      interview_url: payload.interview_url,
      google_map_url: payload.google_map_url,
      x_url: payload.x_url,
      instagram_url: payload.instagram_url,
      line_url: payload.line_url,
      facebook_url: payload.facebook_url,
      youtube_url: payload.youtube_url,
      store_photos: payload.store_photos,
      floor_map_url: payload.floor_map_url,
      updated_by: 'STF-001',
    });
    const updated = db.stores.updateById(id, patch);

    if (!updated) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      message: '店舗情報を更新しました',
      store: updated,
    });
  } catch (error) {
    console.error('Error updating store detail:', error);
    return NextResponse.json({ error: 'Failed to update store detail' }, { status: 500 });
  }
}
