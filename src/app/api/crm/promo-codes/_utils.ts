/**
 * ルート層のヘルパー。
 *
 * 実効ステータス・使用率・コード採番といった純粋な派生ロジックは
 * `_mock-db/tables/campaign.table.ts` 側にあり、ここでは `db` を使った
 * 名前解決とレスポンス整形、および NextResponse のエラー組み立てだけを行う。
 */
import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  deriveEffectiveStatus,
  promoCodeRemaining,
  promoCodeUsageRate,
} from '@/app/api/_mock-db/tables/campaign.table';
import {
  PROMO_CODE_ERROR_CODES,
  type PromoCodeListItemResponse,
  type PromoCodeRow,
} from '@/app/api/_schemas/promo-code.schema';

/** 実効ステータスはキャンペーン行に依存するため、ここで解決して純関数へ渡す。 */
export function effectiveStatusOf(row: PromoCodeRow) {
  return deriveEffectiveStatus(row, db.campaigns.getById(row.campaign_id, true));
}

export function toPromoCodeListItem(row: PromoCodeRow): PromoCodeListItemResponse {
  const campaign = db.campaigns.getById(row.campaign_id, true);

  return {
    id: row.id,
    code: row.code,
    campaignId: row.campaign_id,
    campaignName: campaign?.name ?? row.campaign_id,
    campaignIsAccepting: campaign?.is_accepting ?? false,
    campaignDeletedAt: campaign?.deleted_at ?? null,
    brandEnum: row.brand_enum,
    scopeType: row.scope_type,
    issuedStoreId: row.issued_store_id,
    issuedStoreName: row.issued_store_id
      ? (db.stores.getById(row.issued_store_id)?.name ?? row.issued_store_id)
      : null,
    generationMethod: row.generation_method,
    description: row.description,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    usageRate: promoCodeUsageRate(row),
    remaining: promoCodeRemaining(row),
    status: row.status,
    effectiveStatus: deriveEffectiveStatus(row, campaign),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function promoError(status: number, code: string, message: string, userMessage: string) {
  return NextResponse.json({ code, message, userMessage }, { status });
}

export const promoCodeErrors = {
  validation: (userMessage: string) =>
    promoError(400, PROMO_CODE_ERROR_CODES.validation, 'Validation failed', userMessage),
  notFound: () =>
    promoError(
      404,
      PROMO_CODE_ERROR_CODES.notFound,
      'Promotion code not found',
      'プロモーションコードが見つかりません',
    ),
  duplicate: () =>
    promoError(
      409,
      PROMO_CODE_ERROR_CODES.duplicate,
      'Promotion code already exists',
      'このコードは既に使われています',
    ),
  brandMismatch: () =>
    promoError(
      422,
      PROMO_CODE_ERROR_CODES.brandMismatch,
      'Brand does not match the campaign brand',
      'ブランドがキャンペーンと一致しません',
    ),
  scopeForbidden: () =>
    promoError(
      403,
      PROMO_CODE_ERROR_CODES.scopeForbidden,
      'Staff may only issue issuer-store-only codes',
      '店舗スタッフが発行できるのは「発行店舗のみ」のコードです',
    ),
  conflict: (userMessage: string) =>
    promoError(409, PROMO_CODE_ERROR_CODES.conflict, 'Conflicting state', userMessage),
  internal: (message: string) =>
    promoError(500, 'E-SYS-001', message, 'サーバーエラーが発生しました'),
} as const;
