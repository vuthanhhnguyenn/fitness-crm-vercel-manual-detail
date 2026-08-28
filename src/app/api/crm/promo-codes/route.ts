import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { generatePromoCode } from '@/app/api/_mock-db/tables/campaign.table';
import {
  CreatePromoCodeBodySchema,
  CreatePromoCodeResponseSchema,
  GetPromoCodesQueryParamsSchema,
  GetPromoCodesResponseSchema,
  PromoCodeErrorResponseSchema,
  type PromoCodeRow,
} from '@/app/api/_schemas/promo-code.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { effectiveStatusOf, promoCodeErrors, toPromoCodeListItem } from './_utils';

registerRoute({
  method: 'get',
  path: '/crm/promo-codes',
  summary: 'List promotion codes',
  description: 'プロモーションコードを条件で絞り込んで取得する (G-06 FR-014)',
  tags: ['PromoCodes'],
  query: GetPromoCodesQueryParamsSchema,
  responses: [
    { status: 200, schema: GetPromoCodesResponseSchema, description: 'Promotion code list' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/promo-codes',
  summary: 'Issue a promotion code',
  description: 'プロモーションコードを発行する (G-06 FR-001/FR-002)',
  tags: ['PromoCodes'],
  requestBody: { schema: CreatePromoCodeBodySchema, description: 'コード発行リクエスト' },
  responses: [
    { status: 201, schema: CreatePromoCodeResponseSchema, description: 'Issued' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Validation error' },
    {
      status: 403,
      schema: PromoCodeErrorResponseSchema,
      description: 'Scope not allowed for role',
    },
    { status: 409, schema: PromoCodeErrorResponseSchema, description: 'Duplicate code' },
    { status: 422, schema: PromoCodeErrorResponseSchema, description: 'Brand mismatch' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

const SORT_ACCESSORS: Record<string, (row: PromoCodeRow) => string> = {
  createdAt: (row) => row.created_at,
  validTo: (row) => row.valid_to,
  usedCount: (row) => String(row.used_count).padStart(12, '0'),
  code: (row) => row.code,
};

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      if (value !== '') queryObj[key] = value;
    });

    const parsed = GetPromoCodesQueryParamsSchema.safeParse(queryObj);
    if (!parsed.success) {
      return promoCodeErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const {
      page,
      limit,
      campaignId,
      scopeType,
      brandEnum,
      issuedStoreId,
      createdBy,
      status,
      codePrefix,
      query,
      validFromAfter,
      validToBefore,
      sort,
      order,
    } = parsed.data;

    // サマリー (発行数・総利用・割引総額) はフィルター前のキャンペーン単位母集団で集計する。
    const scoped = campaignId
      ? db.promoCodes.getListByCampaignId(campaignId)
      : db.promoCodes.getList();
    let filtered = [...scoped];

    if (scopeType) filtered = filtered.filter((row) => row.scope_type === scopeType);
    if (brandEnum) filtered = filtered.filter((row) => row.brand_enum === brandEnum);
    if (issuedStoreId) filtered = filtered.filter((row) => row.issued_store_id === issuedStoreId);
    if (createdBy) filtered = filtered.filter((row) => row.created_by === createdBy);
    if (status) filtered = filtered.filter((row) => effectiveStatusOf(row) === status);
    if (codePrefix) {
      const prefix = codePrefix.trim().toUpperCase();
      filtered = filtered.filter((row) => row.code.toUpperCase().startsWith(prefix));
    }
    // プロトタイプの検索ボックスはコードと説明の両方に部分一致する (campaign-detail.tsx:L585-593)
    if (query) {
      const keyword = query.trim().toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.code.toLowerCase().includes(keyword) ||
          (row.description ?? '').toLowerCase().includes(keyword),
      );
    }
    if (validFromAfter) filtered = filtered.filter((row) => row.valid_from >= validFromAfter);
    if (validToBefore) filtered = filtered.filter((row) => row.valid_to <= validToBefore);

    const accessor = SORT_ACCESSORS[sort] ?? SORT_ACCESSORS.createdAt!;
    filtered.sort((a, b) => {
      const comparison = accessor(a).localeCompare(accessor(b), 'ja');
      return order === 'asc' ? comparison : -comparison;
    });

    const totalItems = filtered.length;
    const start = (page - 1) * limit;

    return NextResponse.json({
      items: filtered.slice(start, start + limit).map(toPromoCodeListItem),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 0,
        totalAllItems: scoped.length,
      },
      summary: {
        issuedCount: scoped.length,
        totalUsedCount: scoped.reduce((sum, row) => sum + row.used_count, 0),
      },
    });
  } catch (error) {
    console.error('GET /crm/promo-codes error:', error);
    return promoCodeErrors.internal('Failed to fetch promotion codes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = CreatePromoCodeBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return promoCodeErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const data = parsed.data;

    const auth = getAuthUserFromRequest(request);
    if (auth.ok && auth.user.role === 'Staff' && data.scopeType !== 'issuer_store_only') {
      return promoCodeErrors.scopeForbidden();
    }

    const campaign = db.campaigns.getById(data.campaignId);
    if (!campaign) return promoCodeErrors.notFound();

    // Promotion_Code_Management: brandEnum は campaigns.brand_enum と一致必須 (E-PRM-009)
    if (data.brandEnum !== campaign.brand_enum) return promoCodeErrors.brandMismatch();

    const storeCode = data.issuedStoreId
      ? (db.stores.getById(data.issuedStoreId)?.club_code ?? 'STR01')
      : 'STR01';
    const code =
      data.generationMethod === 'manual' && data.code
        ? data.code.trim()
        : generatePromoCode(data.scopeType, storeCode);

    if (db.promoCodes.getByCode(code)) return promoCodeErrors.duplicate();

    const now = new Date().toISOString();
    const row: PromoCodeRow = {
      id: db.promoCodes.nextId(),
      code,
      campaign_id: campaign.id,
      brand_enum: data.brandEnum,
      scope_type: data.scopeType,
      issued_store_id: data.issuedStoreId ?? null,
      generation_method: data.generationMethod,
      description: data.description ?? null,
      valid_from: data.validFrom,
      valid_to: data.validTo,
      max_uses: data.maxUses ?? null,
      used_count: 0,
      status: 'active',
      disabled_reason: null,
      created_by: 'staff-hq-001',
      created_by_name: '本部',
      created_at: now,
      updated_at: now,
    };

    db.promoCodes.create(row);

    return NextResponse.json(
      { message: 'プロモーションコードを発行しました', promoCode: toPromoCodeListItem(row) },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/promo-codes error:', error);
    return promoCodeErrors.internal('Failed to issue promotion code');
  }
}
