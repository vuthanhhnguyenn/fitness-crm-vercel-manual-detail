import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  buildChangeHistoryEntries,
  isAcceptingOnlyPayload,
  isCampaignInUse,
} from '@/app/api/_mock-db/tables/campaign.table';
import {
  CampaignErrorResponseSchema,
  type CampaignRow,
  DeleteCampaignResponseSchema,
  GetCampaignDetailResponseSchema,
  UpdateCampaignBodySchema,
  UpdateCampaignResponseSchema,
} from '@/app/api/_schemas/campaign.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { campaignErrors, campaignNameResolver, toCampaignDetail } from '../_utils';

const idParam = {
  name: 'id',
  in: 'path' as const,
  required: true,
  description: 'Campaign ID',
  schema: { type: 'string' as const },
};

registerRoute({
  method: 'get',
  path: '/crm/campaigns/{id}',
  summary: 'Get campaign detail',
  description: 'キャンペーンマスタの詳細を取得する (G-03 FR-003)',
  tags: ['Campaigns'],
  parameters: [idParam],
  responses: [
    { status: 200, schema: GetCampaignDetailResponseSchema, description: 'Campaign detail' },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/campaigns/{id}',
  summary: 'Update campaign master',
  description:
    'キャンペーンマスタを部分更新する。適用中の会員・申請がある場合は受付可否のみ変更できる (API-088 E-CMP-002)',
  tags: ['Campaigns'],
  parameters: [idParam],
  requestBody: { schema: UpdateCampaignBodySchema, description: 'キャンペーン更新リクエスト' },
  responses: [
    { status: 200, schema: UpdateCampaignResponseSchema, description: 'Updated' },
    { status: 400, schema: CampaignErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 409, schema: CampaignErrorResponseSchema, description: 'Duplicate code / in use' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/campaigns/{id}',
  summary: 'Delete campaign master',
  description: 'キャンペーンマスタを論理削除する (G-03 / API-088)',
  tags: ['Campaigns'],
  parameters: [idParam],
  responses: [
    { status: 200, schema: DeleteCampaignResponseSchema, description: 'Deleted' },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 409, schema: CampaignErrorResponseSchema, description: 'Campaign in use' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = db.campaigns.getById(id);
    if (!row) return campaignErrors.notFound();

    return NextResponse.json({ campaign: toCampaignDetail(row) }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/campaigns/[id] error:', error);
    return campaignErrors.internal('Failed to fetch campaign detail');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const parsed = UpdateCampaignBodySchema.safeParse(body);
    if (!parsed.success) {
      return campaignErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const existing = db.campaigns.getById(id);
    if (!existing) return campaignErrors.notFound();

    if (isCampaignInUse(existing) && !isAcceptingOnlyPayload(body)) {
      return campaignErrors.inUse();
    }

    const data = parsed.data;

    if (data.campaignCode && db.campaigns.isCodeTaken(data.campaignCode, id)) {
      return campaignErrors.codeDuplicate();
    }

    const patch: Partial<CampaignRow> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.campaignCode !== undefined) patch.campaign_code = data.campaignCode;
    if (data.remarks !== undefined) patch.remarks = data.remarks;
    if (data.isAccepting !== undefined) patch.is_accepting = data.isAccepting;
    if (data.recruitmentStart !== undefined) patch.recruitment_start = data.recruitmentStart;
    if (data.recruitmentEnd !== undefined) patch.recruitment_end = data.recruitmentEnd;
    if (data.usageStart !== undefined) patch.usage_start = data.usageStart;
    if (data.usageEnd !== undefined) patch.usage_end = data.usageEnd;
    if (data.applyStartMonth !== undefined) patch.apply_start_month = data.applyStartMonth;
    if (data.applyStartSpecificN !== undefined)
      patch.apply_start_specific_n = data.applyStartSpecificN;
    if (data.applyDurationMonths !== undefined)
      patch.apply_duration_months = data.applyDurationMonths;
    if (data.planId !== undefined) patch.plan_id = data.planId;
    if (data.planDiscountMonth1 !== undefined) patch.plan_discount_month1 = data.planDiscountMonth1;
    if (data.planDiscountMonth1Type !== undefined)
      patch.plan_discount_month1_type = data.planDiscountMonth1Type;
    if (data.planDiscountMonth1Value !== undefined)
      patch.plan_discount_month1_value = data.planDiscountMonth1Value;
    if (data.planDiscountMonth2 !== undefined) patch.plan_discount_month2 = data.planDiscountMonth2;
    if (data.planDiscountMonth2Type !== undefined)
      patch.plan_discount_month2_type = data.planDiscountMonth2Type;
    if (data.planDiscountMonth2Value !== undefined)
      patch.plan_discount_month2_value = data.planDiscountMonth2Value;
    // API-088: 配列は全置換 (省略=変更なし / [] で全消し)
    if (data.campaignOptionDiscounts !== undefined)
      patch.option_discounts = data.campaignOptionDiscounts;
    if (data.campaignAutoOptions !== undefined) patch.auto_options = data.campaignAutoOptions;
    if (data.entryCap !== undefined) patch.entry_cap = data.entryCap;
    if (data.lockInMonths !== undefined) patch.lock_in_months = data.lockInMonths;
    if (data.publishScope !== undefined) patch.publish_scope = data.publishScope;
    if (data.publishStoreIds !== undefined) patch.publish_store_ids = data.publishStoreIds;
    if (data.conditionOptionIds !== undefined) patch.condition_option_ids = data.conditionOptionIds;
    if (data.referral !== undefined) patch.referral = data.referral;

    const changedAt = new Date().toISOString();
    patch.updated_at = changedAt;
    patch.updated_by = '本部管理者';

    const updated = db.campaigns.update(id, patch);
    if (!updated) return campaignErrors.notFound();

    db.campaigns.appendChangeHistory(
      id,
      buildChangeHistoryEntries(existing, updated, '本部管理者', changedAt, campaignNameResolver),
    );

    return NextResponse.json(
      { message: 'キャンペーンを更新しました', campaign: toCampaignDetail(updated) },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/campaigns/[id] error:', error);
    return campaignErrors.internal('Failed to update campaign');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = db.campaigns.getById(id);
    if (!existing) return campaignErrors.notFound();

    if (isCampaignInUse(existing)) return campaignErrors.inUse();

    db.campaigns.softDelete(id);
    return NextResponse.json({ message: 'キャンペーンを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/campaigns/[id] error:', error);
    return campaignErrors.internal('Failed to delete campaign');
  }
}
