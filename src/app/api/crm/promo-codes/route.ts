import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreatePromoCodeResponseSchema,
  GetPromoCodesQuerySchema,
  GetPromoCodesResponseSchema,
  PromoCodeErrorResponseSchema,
  PromoCodeUpsertBodySchema,
} from '@/app/api/_schemas/promo-code.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/promo-codes',
  summary: 'Get promo codes',
  description: 'Get promo codes by campaign',
  tags: ['PromoCodes'],
  query: GetPromoCodesQuerySchema,
  responses: [
    { status: 200, schema: GetPromoCodesResponseSchema, description: 'Promo code list' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/promo-codes',
  summary: 'Create promo code',
  description: 'Create a new promo code in mock storage',
  tags: ['PromoCodes'],
  requestBody: {
    schema: PromoCodeUpsertBodySchema,
    description: 'Promo code creation payload',
  },
  responses: [
    { status: 201, schema: CreatePromoCodeResponseSchema, description: 'Created promo code' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Validation error' },
    { status: 409, schema: PromoCodeErrorResponseSchema, description: 'Duplicate code' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetPromoCodesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const promoCodes = db.promoCodes.getListByCampaignId(validationResult.data.campaign_id);

    return NextResponse.json({ promo_codes: promoCodes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = PromoCodeUpsertBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const existing = db.promoCodes.getByCode(validationResult.data.code);
    if (existing) {
      return NextResponse.json({ error: 'このコードは既に存在します' }, { status: 409 });
    }

    const promoCode = db.promoCodes.add({
      campaignId: validationResult.data.campaignId,
      campaignName: validationResult.data.campaignName,
      code: validationResult.data.code,
      description: validationResult.data.description ?? null,
      validFrom: validationResult.data.validFrom,
      validTo: validationResult.data.validTo,
      usageCount: validationResult.data.usageCount ?? 0,
      usageCap: validationResult.data.usageCap ?? null,
      usageCapMode: validationResult.data.usageCapMode,
      storeScope: validationResult.data.storeScope,
      issuedByLabel: validationResult.data.issuedByLabel,
      status: validationResult.data.status ?? 'active',
    });
    return NextResponse.json({ promo_code: promoCode }, { status: 201 });
  } catch (error) {
    console.error('POST /crm/promo-codes error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? `Failed to create promo code: ${error.message}`
            : 'Failed to create promo code',
      },
      { status: 500 },
    );
  }
}
