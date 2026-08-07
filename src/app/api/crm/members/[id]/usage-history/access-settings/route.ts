import { NextResponse } from 'next/server';

import { MOCK_MEMBER_ACCESS_SETTINGS } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetUsageHistoryAccessSettingsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/usage-history/access-settings',
  summary: 'Get member usage history access settings',
  description: 'Get access settings block data for usage history tab',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetUsageHistoryAccessSettingsResponseSchema,
      description: 'Member access settings',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const settings = MOCK_MEMBER_ACCESS_SETTINGS[id] ?? MOCK_MEMBER_ACCESS_SETTINGS['member-001'];

    if (!settings) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/usage-history/access-settings:', error);
    return NextResponse.json({ error: 'Failed to fetch access settings' }, { status: 500 });
  }
}
