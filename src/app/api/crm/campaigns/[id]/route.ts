import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CampaignErrorResponseSchema,
  GetCampaignDetailResponseSchema,
  UpdateCampaignResponseSchema,
  UpsertCampaignBodySchema,
} from '@/app/api/_schemas/campaign.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { buildCampaignDetail } from '../_utils';

function buildLiveCampaignDetail(id: string) {
  const campaign = db.campaigns.getById(id);
  if (!campaign) {
    return undefined;
  }

  return {
    ...campaign,
    promo_code_previews: db.promoCodes.getListByCampaignId(id).map((promoCode) => ({
      code: promoCode.code,
      description: promoCode.description,
      valid_from: promoCode.valid_from,
      valid_to: promoCode.valid_to,
      status: promoCode.status,
    })),
  };
}

registerRoute({
  method: 'get',
  path: '/crm/campaigns/{id}',
  summary: 'Get campaign detail',
  description: 'Get detailed information about a single campaign master record',
  tags: ['Campaigns'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Campaign ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetCampaignDetailResponseSchema, description: 'Campaign detail' },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/campaigns/{id}',
  summary: 'Update campaign detail',
  description: 'Update an existing campaign master by ID',
  tags: ['Campaigns'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Campaign ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpsertCampaignBodySchema,
    description: 'キャンペーン更新リクエスト',
  },
  responses: [
    { status: 200, schema: UpdateCampaignResponseSchema, description: 'Updated successfully' },
    { status: 400, schema: CampaignErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = buildLiveCampaignDetail(id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/campaigns/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = UpsertCampaignBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const existing = db.campaigns.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const data = validationResult.data;
    const duplicate = db.campaigns
      .getList()
      .find(
        (campaign) => campaign.id !== id && campaign.code.toLowerCase() === data.code.toLowerCase(),
      );

    if (duplicate) {
      return NextResponse.json(
        { error: 'キャンペーンコードが重複しています', code: 'campaign_code_duplicate' },
        { status: 400 },
      );
    }

    const nextDetail = buildCampaignDetail(id, data, '本部管理者', existing);
    const updated = db.campaigns.update(id, nextDetail);

    if (!updated) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'キャンペーンを更新しました', campaign: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/campaigns/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
