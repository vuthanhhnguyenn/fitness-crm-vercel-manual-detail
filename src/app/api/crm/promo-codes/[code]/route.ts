import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  PromoCodeErrorResponseSchema,
  UpdatePromoCodeResponseSchema,
  UpdatePromoCodeStatusBodySchema,
} from '@/app/api/_schemas/promo-code.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/promo-codes/{code}',
  summary: 'Update promo code',
  description: 'Update a promo code status in mock storage',
  tags: ['PromoCodes'],
  parameters: [
    {
      name: 'code',
      in: 'path',
      required: true,
      description: 'Promo code',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdatePromoCodeStatusBodySchema,
    description: 'Promo code status update payload',
  },
  responses: [
    { status: 200, schema: UpdatePromoCodeResponseSchema, description: 'Updated promo code' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: PromoCodeErrorResponseSchema, description: 'Promo code not found' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const validation = UpdatePromoCodeStatusBodySchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { status, reason } = validation.data;
    if (status === 'inactive' && !reason?.trim()) {
      return NextResponse.json({ error: '無効化理由を入力してください' }, { status: 400 });
    }

    const existing = db.promoCodes.getByCode(code);
    if (!existing) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    const updated = db.promoCodes.updateByCode(code, {
      status,
      disabled_reason: status === 'inactive' ? (reason?.trim() ?? null) : null,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    return NextResponse.json({ promo_code: updated }, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/promo-codes/[code] error:', error);
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}
