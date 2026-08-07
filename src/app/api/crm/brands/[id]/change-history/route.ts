import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetBrandChangeHistoryResponse,
  GetBrandChangeHistoryResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/brands/{id}/change-history',
  summary: 'Get Y-07 brand change history',
  description: 'ブランド詳細画面の変更履歴タブで表示する履歴一覧。',
  tags: ['Brands'],
  responses: [
    {
      status: 200,
      schema: GetBrandChangeHistoryResponseSchema,
      description: 'Brand change history',
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

    const response: GetBrandChangeHistoryResponse = {
      histories: db.brands.getChangeHistoryByCode(id),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching brand change history:', error);
    return NextResponse.json({ error: 'Failed to fetch brand change history' }, { status: 500 });
  }
}
