import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CampaignErrorResponseSchema,
  GetCampaignChangeHistoryQueryParamsSchema,
  GetCampaignChangeHistoryResponseSchema,
} from '@/app/api/_schemas/campaign.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { campaignErrors } from '../../_utils';

registerRoute({
  method: 'get',
  path: '/crm/campaigns/{id}/change-history',
  summary: 'Get campaign change history',
  description: 'キャンペーンの変更履歴を時系列で取得する (G-03 FR-S004)',
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
  query: GetCampaignChangeHistoryQueryParamsSchema,
  responses: [
    {
      status: 200,
      schema: GetCampaignChangeHistoryResponseSchema,
      description: 'Campaign change history',
    },
    { status: 404, schema: CampaignErrorResponseSchema, description: 'Campaign not found' },
    { status: 500, schema: CampaignErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!db.campaigns.getById(id)) return campaignErrors.notFound();

    const queryObj: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      if (value !== '') queryObj[key] = value;
    });

    const parsed = GetCampaignChangeHistoryQueryParamsSchema.safeParse(queryObj);
    if (!parsed.success) {
      return campaignErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const { page, limit } = parsed.data;
    const all = [...db.campaigns.getChangeHistory(id)].sort((a, b) => b.date.localeCompare(a.date));
    const totalItems = all.length;
    const start = (page - 1) * limit;

    return NextResponse.json(
      {
        items: all.slice(start, start + limit),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 0,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /crm/campaigns/[id]/change-history error:', error);
    return campaignErrors.internal('Failed to fetch campaign change history');
  }
}
