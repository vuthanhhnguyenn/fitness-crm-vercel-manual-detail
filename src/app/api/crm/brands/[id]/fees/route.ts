import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetBrandFeesResponse,
  GetBrandFeesResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/brands/{id}/fees',
  summary: 'Get Y-07 brand fee groups',
  description: 'ブランド詳細画面の費用タブで表示するサブブランド単位の費用マスタ一覧。',
  tags: ['Brands'],
  responses: [
    {
      status: 200,
      schema: GetBrandFeesResponseSchema,
      description: 'Brand fee groups',
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

    const response: GetBrandFeesResponse = {
      fee_groups: db.brands.getFeesByCode(id),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brand fee groups:', error);
    return NextResponse.json({ error: 'Failed to fetch brand fee groups' }, { status: 500 });
  }
}
