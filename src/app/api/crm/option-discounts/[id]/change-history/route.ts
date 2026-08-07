import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetOptionDiscountChangeHistoryResponseSchema,
} from '@/app/api/_schemas/option-discount.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/option-discounts/{id}/change-history',
  summary: 'Get option discount change history',
  description: 'Get change history for a specific option discount',
  tags: ['Options'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Option Discount ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetOptionDiscountChangeHistoryResponseSchema,
      description: 'Option discount change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = db.optionDiscount.getById(id);

    if (!detail) {
      return NextResponse.json({ error: 'Option discount not found' }, { status: 404 });
    }

    return NextResponse.json({ history: db.optionDiscount.getChangeHistory(id) }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/option-discounts/[id]/change-history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
