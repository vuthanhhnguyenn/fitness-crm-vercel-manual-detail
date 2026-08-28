import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ExportPromoCodesQueryParamsSchema,
  PromoCodeErrorResponseSchema,
} from '@/app/api/_schemas/promo-code.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { effectiveStatusOf, promoCodeErrors, toPromoCodeListItem } from '../_utils';

registerRoute({
  method: 'get',
  path: '/crm/promo-codes/export',
  summary: 'Export promotion codes as CSV',
  description: 'プロモーションコードをCSVで出力する (G-06 FR-013)',
  tags: ['PromoCodes'],
  query: ExportPromoCodesQueryParamsSchema,
  responses: [
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

const MAX_RANGE_DAYS = 366;

const CSV_HEADERS = [
  'コード',
  '説明',
  'キャンペーン',
  'ブランド',
  '適用店舗タイプ',
  '発行店舗',
  '有効期間開始',
  '有効期間終了',
  '使用済み',
  '使用上限',
  '残数',
  '使用率(%)',
  'ステータス',
  '発行者',
  '発行日時',
] as const;

function csvCell(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      if (value !== '') queryObj[key] = value;
    });

    const parsed = ExportPromoCodesQueryParamsSchema.safeParse(queryObj);
    if (!parsed.success) {
      return promoCodeErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const {
      from,
      to,
      encoding,
      campaignId,
      scopeType,
      brandEnum,
      issuedStoreId,
      createdBy,
      status,
      codePrefix,
      validFromAfter,
      validToBefore,
    } = parsed.data;

    const rangeDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    if (!Number.isFinite(rangeDays) || rangeDays < 0) {
      return promoCodeErrors.validation('出力期間の指定が不正です');
    }
    if (rangeDays > MAX_RANGE_DAYS) {
      return promoCodeErrors.validation('出力期間は366日以内で指定してください');
    }

    let rows = campaignId ? db.promoCodes.getListByCampaignId(campaignId) : db.promoCodes.getList();

    rows = rows.filter((row) => row.created_at >= from && row.created_at <= `${to}T23:59:59.999Z`);
    if (scopeType) rows = rows.filter((row) => row.scope_type === scopeType);
    if (brandEnum) rows = rows.filter((row) => row.brand_enum === brandEnum);
    if (issuedStoreId) rows = rows.filter((row) => row.issued_store_id === issuedStoreId);
    if (createdBy) rows = rows.filter((row) => row.created_by === createdBy);
    if (status) rows = rows.filter((row) => effectiveStatusOf(row) === status);
    if (codePrefix) {
      const prefix = codePrefix.trim().toUpperCase();
      rows = rows.filter((row) => row.code.toUpperCase().startsWith(prefix));
    }
    if (validFromAfter) rows = rows.filter((row) => row.valid_from >= validFromAfter);
    if (validToBefore) rows = rows.filter((row) => row.valid_to <= validToBefore);

    const lines = [
      CSV_HEADERS.join(','),
      ...rows.map((row) => {
        const item = toPromoCodeListItem(row);
        return [
          item.code,
          item.description,
          item.campaignName,
          item.brandEnum,
          item.scopeType,
          item.issuedStoreName,
          item.validFrom,
          item.validTo,
          item.usedCount,
          item.maxUses,
          item.remaining,
          item.usageRate,
          item.effectiveStatus,
          item.createdByName,
          item.createdAt,
        ]
          .map(csvCell)
          .join(',');
      }),
    ];

    // sjis-bom 指定時も内容はUTF-8のまま。BOMだけ付けてExcelで開ける形にする (モック簡略化)。
    const body = (encoding === 'sjis-bom' ? '﻿' : '') + lines.join('\r\n');

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="promotion-codes-${from}_${to}.csv"`,
      },
    });
  } catch (error) {
    console.error('GET /crm/promo-codes/export error:', error);
    return promoCodeErrors.internal('Failed to export promotion codes');
  }
}
