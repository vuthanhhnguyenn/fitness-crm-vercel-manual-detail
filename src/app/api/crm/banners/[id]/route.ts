import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { enrichBanner } from '@/app/api/_mock-db/tables/banner.table';
import {
  BannerItemResponseSchema,
  DeleteBannerResponseSchema,
  ErrorResponseSchema,
  UpdateBannerBodySchema,
  UpdateBannerResponseSchema,
} from '@/app/api/_schemas/banner.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/banners/{id}',
  summary: 'Get banner by ID',
  description: 'Fetch a single banner for edit pre-fill',
  tags: ['Banners'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Banner ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: BannerItemResponseSchema,
      description: 'Banner detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Banner not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const banner = db.banners.getById(id);

    if (!banner) {
      return NextResponse.json({ error: 'バナーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      { ...enrichBanner(banner, db.banners.getBrandEnum(banner.id)) },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /crm/banners/[id] error:', error);
    return NextResponse.json({ error: 'バナー情報の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/banners/{id}',
  summary: 'Update banner',
  description: 'Partial update of a banner by ID',
  tags: ['Banners'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Banner ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateBannerBodySchema,
    description: 'Banner update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateBannerResponseSchema,
      description: 'Banner updated',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Banner not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdateBannerBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.banners.update(id, validationResult.data);

    if (!updated) {
      return NextResponse.json({ error: 'バナーが見つかりません' }, { status: 404 });
    }

    const brandIds = validationResult.data.brandEnum ?? db.banners.getBrandEnum(id);
    return NextResponse.json(
      {
        message: 'バナーの変更を保存しました',
        banner: enrichBanner(updated, brandIds),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/banners/[id] error:', error);
    return NextResponse.json({ error: 'バナーの更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/banners/{id}',
  summary: 'Delete banner',
  description: 'Delete a banner by id',
  tags: ['Banners'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Banner ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: DeleteBannerResponseSchema,
      description: 'Banner deleted',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Banner not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = db.banners.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'バナーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: 'バナーを削除しました', id }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/banners/[id] error:', error);
    return NextResponse.json({ error: 'バナーの削除に失敗しました' }, { status: 500 });
  }
}
