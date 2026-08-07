import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateBrandRequestSchema,
  type CreateBrandResponse,
  CreateBrandResponseSchema,
  GetBrandsQuerySchema,
  type GetBrandsResponse,
  GetBrandsResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

function normalizeBrandIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function matchesBrandKeyword(
  brand: GetBrandsResponse['brands'][number],
  keyword?: string,
): boolean {
  const normalizedKeyword = keyword?.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  return [brand.brand_id, brand.display_name].some((value) =>
    value.toLowerCase().includes(normalizedKeyword),
  );
}

registerRoute({
  method: 'get',
  path: '/crm/brands',
  summary: 'List Y-07 brand master',
  description:
    'JOYFIT / FIT365 のブランド基本設定（入会金・手数料デフォルト）。G-01 主契約の参照元。',
  tags: ['Brands'],
  query: GetBrandsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetBrandsResponseSchema,
      description: 'Brand list',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/brands',
  summary: 'Create Y-07 brand master row',
  description: 'ブランド基本設定の新規作成。本部のみ編集可能。',
  tags: ['Brands'],
  requestBody: {
    schema: CreateBrandRequestSchema,
    description: 'Brand create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateBrandResponseSchema,
      description: 'Created',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObject: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObject[key] = value;
    });

    const parsedQuery = GetBrandsQuerySchema.safeParse(queryObject);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { page, limit, search } = parsedQuery.data;
    const allBrands = db.brands.getList();
    const filteredBrands = allBrands.filter((brand) => matchesBrandKeyword(brand, search));
    const startIndex = (page - 1) * limit;
    const paginatedBrands = filteredBrands.slice(startIndex, startIndex + limit);

    const response: GetBrandsResponse = {
      brands: paginatedBrands,
      pagination: {
        page,
        limit,
        total: filteredBrands.length,
        total_pages: Math.max(1, Math.ceil(filteredBrands.length / limit)),
        all_total: allBrands.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = CreateBrandRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const normalizedBrandId = normalizeBrandIdentifier(parsedBody.data.brand_id);
    if (db.brands.getByBrandId(normalizedBrandId) || db.brands.getByCode(normalizedBrandId)) {
      return NextResponse.json(
        { error: '同じブランドIDのブランドが既に存在します' },
        { status: 400 },
      );
    }

    const brand = db.brands.add(parsedBody.data);
    const response: CreateBrandResponse = {
      message: 'ブランドを作成しました',
      brand,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
