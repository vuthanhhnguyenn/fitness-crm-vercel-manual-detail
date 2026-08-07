import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetUsageHistoryStoresResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/stores',
  summary: "Get stores available for member's brand",
  description:
    'Get all stores belonging to the same brand as the member, used for filtering entry/exit history',
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
      schema: GetUsageHistoryStoresResponseSchema,
      description: 'Stores available for usage history filtering',
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberBrand = member.profile.brand;
    const allStores = db.stores.getList();

    const stores = allStores
      .filter((store) => store.brand === memberBrand)
      .map((store) => ({
        id: store.id,
        store_id: store.store_id,
        name: store.name,
      }));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
