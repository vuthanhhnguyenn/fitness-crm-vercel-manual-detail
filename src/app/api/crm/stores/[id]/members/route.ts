import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { StoreMembersResponseSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{storeId}/members',
  summary: 'List members scoped to a store',
  description:
    'Thin { id, name, has_unpaid } list powering the Sales Management manual registration Store → Member cascading picker',
  tags: ['Billing'],
  parameters: [
    {
      name: 'storeId',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Store ID',
    },
  ],
  responses: [
    { status: 200, schema: StoreMembersResponseSchema, description: 'Store-scoped member list' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const members = db.billingRecords.getStoreMembers(id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('GET /crm/stores/[id]/members error:', error);
    return NextResponse.json({ error: 'Failed to fetch store members' }, { status: 500 });
  }
}
