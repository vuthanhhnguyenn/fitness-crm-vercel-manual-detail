import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  GetStoreAccessSettingsResponseSchema,
  UpdateStoreAccessSettingsRequestSchema,
  UpdateStoreAccessSettingsResponseSchema,
} from '@/app/api/_schemas/store-access-settings.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{id}/access-settings',
  summary: 'Get store access settings',
  description: '入退室・相互利用設定（mock）',
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
    {
      status: 200,
      schema: GetStoreAccessSettingsResponseSchema,
      description: 'Access settings',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'put',
  path: '/crm/stores/{id}/access-settings',
  summary: 'Update store access settings',
  description: '入退室・相互利用設定を更新（mock）',
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
    schema: UpdateStoreAccessSettingsRequestSchema,
    description: 'Full access settings payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateStoreAccessSettingsResponseSchema,
      description: 'Updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Store not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access_settings = db.store_access_settings.getByStoreId(id);
    if (!access_settings) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(access_settings);
  } catch (error) {
    console.error('Error getting store access settings:', error);
    return NextResponse.json({ error: 'Failed to get store access settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateStoreAccessSettingsRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.store_access_settings.replaceForStore(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      message: '入退室設定を更新しました',
      access_settings: updated,
    });
  } catch (error) {
    console.error('Error updating store access settings:', error);
    return NextResponse.json({ error: 'Failed to update store access settings' }, { status: 500 });
  }
}
