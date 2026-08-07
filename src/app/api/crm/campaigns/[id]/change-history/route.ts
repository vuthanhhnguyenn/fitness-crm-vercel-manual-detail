import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetCampaignChangeHistoryResponseSchema,
} from '@/app/api/_schemas/campaign.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/campaigns/{id}/change-history',
  summary: 'Get campaign change history',
  description: 'Get change history for a specific campaign master record',
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
    {
      status: 200,
      schema: GetCampaignChangeHistoryResponseSchema,
      description: 'Campaign change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Campaign not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = db.campaigns.getById(id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ history: db.campaigns.getChangeHistory(id) }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/campaigns/[id]/change-history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
