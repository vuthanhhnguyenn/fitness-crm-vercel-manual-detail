import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetBrandDetailResponse,
  GetBrandDetailResponseSchema,
  UpdateBrandRequestSchema,
  type UpdateBrandResponse,
  UpdateBrandResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

function normalizeBrandIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

registerRoute({
  method: 'get',
  path: '/crm/brands/{id}',
  summary: 'Get Y-07 brand detail',
  description: 'ブランド詳細画面の基本情報タブで表示するトップレベルブランド詳細。',
  tags: ['Brands'],
  responses: [
    {
      status: 200,
      schema: GetBrandDetailResponseSchema,
      description: 'Brand detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/brands/{id}',
  summary: 'Update Y-07 brand basic info',
  description: 'ブランド基本情報の更新。本部のみ編集可能。',
  tags: ['Brands'],
  requestBody: {
    schema: UpdateBrandRequestSchema,
    description: 'Brand update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateBrandResponseSchema,
      description: 'Updated',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const brand = db.brands.getByCode(id);

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const response: GetBrandDetailResponse = { brand };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brand detail:', error);
    return NextResponse.json({ error: 'Failed to fetch brand detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const brand = db.brands.getByCode(id);

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = UpdateBrandRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const normalizedBrandId = parsedBody.data.brand_id
      ? normalizeBrandIdentifier(parsedBody.data.brand_id)
      : null;
    const duplicateBrand = normalizedBrandId ? db.brands.getByBrandId(normalizedBrandId) : null;

    if (duplicateBrand && duplicateBrand.code !== brand.code) {
      return NextResponse.json(
        { error: '同じブランドIDのブランドが既に存在します' },
        { status: 400 },
      );
    }

    const updatedBrand = db.brands.update(id, parsedBody.data);
    if (!updatedBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const response: UpdateBrandResponse = {
      message: 'ブランド設定を保存しました',
      brand: updatedBrand,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}
