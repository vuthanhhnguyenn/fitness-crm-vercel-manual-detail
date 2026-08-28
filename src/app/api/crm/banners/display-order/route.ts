import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  PatchBannersDisplayOrderRequestSchema,
  PatchBannersDisplayOrderResponseSchema,
} from '@/app/api/_schemas/banner.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/banners/display-order',
  summary: 'Update banner display order',
  description: 'Persist banner display-order changes',
  tags: ['Banners'],
  requestBody: {
    schema: PatchBannersDisplayOrderRequestSchema,
    description: 'Display-order update payload',
  },
  responses: [
    {
      status: 200,
      schema: PatchBannersDisplayOrderResponseSchema,
      description: 'Display order updated',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'One or more banners not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = PatchBannersDisplayOrderRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.banners.updateDisplayOrder(validationResult.data.banners);
    if (!updated) {
      return NextResponse.json({ error: 'バナーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'バナーの並び順を更新しました',
        banners: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/banners/display-order error:', error);
    return NextResponse.json({ error: '表示順の更新に失敗しました' }, { status: 500 });
  }
}
