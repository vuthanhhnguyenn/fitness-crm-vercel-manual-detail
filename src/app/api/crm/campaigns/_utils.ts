/**
 * ルート層のヘルパー。
 *
 * 純粋な派生ロジック (受付状態・縛り期間・変更履歴の差分) は
 * `_mock-db/tables/campaign.table.ts` 側にあり、ここでは `db` を使った
 * 名前解決とレスポンス整形、および NextResponse のエラー組み立てだけを行う。
 */
import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type CampaignNameResolver,
  buildLockInExample,
  deriveAcceptState,
} from '@/app/api/_mock-db/tables/campaign.table';
import {
  CAMPAIGN_ERROR_CODES,
  type CampaignDetailResponse,
  type CampaignListItemResponse,
  type CampaignOptionDiscount,
  type CampaignRow,
} from '@/app/api/_schemas/campaign.schema';

function planNameOf(planId: string): string {
  return db.mainContracts.getById(planId)?.name ?? planId;
}

function optionNameOf(optionId: string): string {
  return db.optionMasters.getById(optionId)?.name ?? optionId;
}

function storeNameOf(storeId: string): string {
  return db.stores.getById(storeId)?.name ?? storeId;
}

/** テーブル層の純関数に渡す名前解決。 */
export const campaignNameResolver: CampaignNameResolver = {
  planName: planNameOf,
  optionName: optionNameOf,
  storeName: storeNameOf,
};

export function toCampaignListItem(row: CampaignRow): CampaignListItemResponse {
  return {
    id: row.id,
    brandEnum: row.brand_enum,
    campaignCode: row.campaign_code,
    name: row.name,
    planId: row.plan_id,
    planName: planNameOf(row.plan_id),
    recruitmentStart: row.recruitment_start,
    recruitmentEnd: row.recruitment_end,
    isAccepting: row.is_accepting,
    activeContractCount: row.active_contract_count,
    pendingApplicationCount: row.pending_application_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entryCap: row.entry_cap,
    acceptState: deriveAcceptState(row),
    hasPromotionCode: db.promoCodes.hasAnyByCampaignId(row.id),
  };
}

export function toCampaignDetail(row: CampaignRow): CampaignDetailResponse {
  const links = db.storeCampaignLinks.getByCampaignId(row.id);

  const optionDiscounts: CampaignOptionDiscount[] = row.option_discounts.map((entry) => ({
    optionId: entry.optionId,
    optionName: optionNameOf(entry.optionId),
    discountMonth1: entry.discountMonth1,
    discountMonth1Type: entry.discountMonth1Type,
    discountMonth1Value: entry.discountMonth1Value,
    discountMonth2: entry.discountMonth2,
    discountMonth2Type: entry.discountMonth2Type,
    discountMonth2Value: entry.discountMonth2Value,
  }));

  return {
    ...toCampaignListItem(row),
    remarks: row.remarks,
    usageStart: row.usage_start,
    usageEnd: row.usage_end,
    applyStartMonth: row.apply_start_month,
    applyStartSpecificN: row.apply_start_specific_n,
    applyDurationMonths: row.apply_duration_months,
    planDiscountMonth1: row.plan_discount_month1,
    planDiscountMonth1Type: row.plan_discount_month1_type,
    planDiscountMonth1Value: row.plan_discount_month1_value,
    planDiscountMonth2: row.plan_discount_month2,
    planDiscountMonth2Type: row.plan_discount_month2_type,
    planDiscountMonth2Value: row.plan_discount_month2_value,
    campaignOptionDiscounts: optionDiscounts,
    campaignAutoOptions: row.auto_options.map((entry) => ({
      optionId: entry.optionId,
      optionName: optionNameOf(entry.optionId),
      targetSexes: entry.targetSexes,
    })),
    storeCount: links.length,
    promotionCodeCount: db.promoCodes.countActiveByCampaignId(row.id),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lockInMonths: row.lock_in_months,
    lockInExample: buildLockInExample(row),
    publishScope: row.publish_scope,
    publishStores: row.publish_store_ids.map((storeId) => ({
      storeId,
      storeName: storeNameOf(storeId),
    })),
    conditionOptions: row.condition_option_ids.map((optionId) => ({
      optionId,
      optionName: optionNameOf(optionId),
    })),
    referral: row.referral,
    stats: {
      appliedMemberCount: row.active_contract_count,
      pendingApplicationCount: row.pending_application_count,
      monthlyNewApplicationCount: row.monthly_new_application_count,
      enrollmentChannels: {
        mobile: row.channel_mobile_count,
        manual: row.channel_manual_count,
        referral: row.channel_referral_count,
      },
    },
    storeUsages: links.map((link) => ({
      storeId: link.store_id,
      storeName: storeNameOf(link.store_id),
      linkedAt: link.linked_at,
      linkedBy: link.linked_by,
    })),
  };
}

export function campaignError(
  status: number,
  code: string,
  message: string,
  userMessage: string,
): NextResponse {
  return NextResponse.json({ code, message, userMessage }, { status });
}

export const campaignErrors = {
  validation: (userMessage: string) =>
    campaignError(400, CAMPAIGN_ERROR_CODES.validation, 'Validation failed', userMessage),
  notFound: () =>
    campaignError(
      404,
      CAMPAIGN_ERROR_CODES.notFound,
      'Campaign not found',
      'キャンペーンが見つかりません',
    ),
  codeDuplicate: () =>
    campaignError(
      409,
      CAMPAIGN_ERROR_CODES.codeDuplicate,
      'Campaign code already exists',
      'このコードは既に使われています',
    ),
  inUse: () =>
    campaignError(
      409,
      CAMPAIGN_ERROR_CODES.inUse,
      'Campaign is referenced by active contracts or pending applications',
      '適用中の会員または申請があるため、受付可否以外は変更できません。受付を停止し、新しいキャンペーンを登録してください。',
    ),
  internal: (message: string) =>
    campaignError(500, 'E-SYS-001', message, 'サーバーエラーが発生しました'),
} as const;
