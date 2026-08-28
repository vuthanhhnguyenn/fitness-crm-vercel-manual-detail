import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { deriveAcceptState } from '@/app/api/_mock-db/tables/campaign.table';
import {
  CampaignErrorResponseSchema,
  type CampaignRow,
  CreateCampaignBodySchema,
  CreateCampaignResponseSchema,
  GetCampaignsQueryParamsSchema,
  GetCampaignsResponseSchema,
} from '@/app/api/_schemas/campaign.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { campaignErrors, toCampaignDetail, toCampaignListItem } from './_utils';

registerRoute({
  method: 'get',
  path: '/crm/campaigns',
  summary: 'Get campaign masters',
  description: 'キャンペーンマスタの一覧を取得する (G-03 FR-001)',
  tags: ['Campaigns'],
  query: GetCampaignsQueryParamsSchema,
  responses: [
    { status: 200, schema: GetCampaignsResponseSchema, description: 'Campaign list' },
    { status: 400, schema: CampaignErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/campaigns',
  summary: 'Create campaign master',
  description: 'キャンペーンマスタを新規登録する (G-03 FR-002)',
  tags: ['Campaigns'],
  requestBody: { schema: CreateCampaignBodySchema, description: 'キャンペーン作成リクエスト' },
  responses: [
    { status: 201, schema: CreateCampaignResponseSchema, description: 'Created' },
    { status: 400, schema: CampaignErrorResponseSchema, description: 'Validation error' },
    { status: 409, schema: CampaignErrorResponseSchema, description: 'Campaign code duplicate' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

const SORT_ACCESSORS: Record<string, (row: CampaignRow) => string> = {
  id: (row) => row.id,
  createdAt: (row) => row.created_at,
  updatedAt: (row) => row.updated_at,
  name: (row) => row.name,
  recruitmentStart: (row) => row.recruitment_start,
  recruitmentEnd: (row) => row.recruitment_end,
};

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      if (value !== '') queryObj[key] = value;
    });

    const parsed = GetCampaignsQueryParamsSchema.safeParse(queryObj);
    if (!parsed.success) {
      return campaignErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const {
      page,
      limit,
      nameQuery,
      codeQuery,
      brandEnum,
      planId,
      isAccepting,
      acceptState,
      recruitmentActiveOn,
      recruitmentFrom,
      recruitmentTo,
      sort,
      order,
    } = parsed.data;

    const all = db.campaigns.getList();
    let filtered = [...all];

    if (nameQuery) {
      const keyword = nameQuery.trim().toLowerCase();
      filtered = filtered.filter((row) => row.name.toLowerCase().includes(keyword));
    }
    if (codeQuery) {
      const keyword = codeQuery.trim().toLowerCase();
      filtered = filtered.filter((row) =>
        (row.campaign_code ?? '').toLowerCase().includes(keyword),
      );
    }
    if (brandEnum) {
      filtered = filtered.filter((row) => row.brand_enum === brandEnum);
    }
    if (planId) {
      filtered = filtered.filter((row) => row.plan_id === planId);
    }
    if (isAccepting !== undefined) {
      filtered = filtered.filter((row) => row.is_accepting === isAccepting);
    }
    if (acceptState) {
      filtered = filtered.filter((row) => deriveAcceptState(row) === acceptState);
    }
    if (recruitmentActiveOn) {
      filtered = filtered.filter(
        (row) =>
          row.recruitment_start <= recruitmentActiveOn &&
          row.recruitment_end >= recruitmentActiveOn,
      );
    }
    // プロトタイプの募集期間フィルターは「指定範囲と重なるもの」を残す挙動 (campaign-list.tsx:L125-126)
    if (recruitmentFrom) {
      filtered = filtered.filter((row) => row.recruitment_end >= recruitmentFrom);
    }
    if (recruitmentTo) {
      filtered = filtered.filter((row) => row.recruitment_start <= recruitmentTo);
    }

    const accessor = SORT_ACCESSORS[sort] ?? SORT_ACCESSORS.createdAt!;
    filtered.sort((a, b) => {
      const comparison = accessor(a).localeCompare(accessor(b), 'ja');
      return order === 'asc' ? comparison : -comparison;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 0;
    const start = (page - 1) * limit;

    return NextResponse.json({
      items: filtered.slice(start, start + limit).map(toCampaignListItem),
      pagination: { page, limit, totalItems, totalPages, totalAllItems: all.length },
    });
  } catch (error) {
    console.error('GET /crm/campaigns error:', error);
    return campaignErrors.internal('Failed to fetch campaigns');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCampaignBodySchema.safeParse(body);

    if (!parsed.success) {
      return campaignErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const data = parsed.data;

    // API-088: campaign_code は非削除行に対する部分ユニーク。null は重複チェック対象外。
    if (data.campaignCode && db.campaigns.isCodeTaken(data.campaignCode)) {
      return campaignErrors.codeDuplicate();
    }

    const now = new Date().toISOString();
    const row: CampaignRow = {
      id: db.campaigns.nextId(),
      brand_enum: data.brandEnum,
      campaign_code: data.campaignCode ?? null,
      name: data.name,
      remarks: data.remarks ?? null,
      is_accepting: data.isAccepting,
      recruitment_start: data.recruitmentStart,
      recruitment_end: data.recruitmentEnd,
      usage_start: data.usageStart ?? null,
      usage_end: data.usageEnd ?? null,
      apply_start_month: data.applyStartMonth ?? null,
      apply_start_specific_n: data.applyStartSpecificN ?? null,
      apply_duration_months: data.applyDurationMonths ?? null,
      plan_id: data.planId,
      plan_discount_month1: data.planDiscountMonth1,
      plan_discount_month1_type: data.planDiscountMonth1Type ?? null,
      plan_discount_month1_value: data.planDiscountMonth1Value ?? null,
      plan_discount_month2: data.planDiscountMonth2,
      plan_discount_month2_type: data.planDiscountMonth2Type ?? null,
      plan_discount_month2_value: data.planDiscountMonth2Value ?? null,
      option_discounts: data.campaignOptionDiscounts,
      auto_options: data.campaignAutoOptions,
      entry_cap: data.entryCap ?? null,
      lock_in_months: data.lockInMonths ?? null,
      publish_scope: data.publishScope,
      publish_store_ids: data.publishStoreIds,
      condition_option_ids: data.conditionOptionIds,
      referral: data.referral ?? {
        enabled: false,
        points: null,
        tieredIncrease: false,
        tierThreshold: null,
        tierPoints: null,
        annualReset: true,
      },
      active_contract_count: 0,
      pending_application_count: 0,
      monthly_new_application_count: 0,
      channel_mobile_count: 0,
      channel_manual_count: 0,
      channel_referral_count: 0,
      created_by: '本部管理者',
      updated_by: '本部管理者',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    db.campaigns.create(row);

    return NextResponse.json(
      { message: 'キャンペーンを登録しました', campaign: toCampaignDetail(row) },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/campaigns error:', error);
    return campaignErrors.internal('Failed to create campaign');
  }
}
