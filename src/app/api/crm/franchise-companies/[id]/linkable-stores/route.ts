import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type FranchiseCompanyLinkedStore,
  type GetFranchiseCompanyLinkableStoresResponse,
  GetFranchiseCompanyLinkableStoresResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/franchise-companies/{id}/linkable-stores',
  summary: 'Get stores linkable to an FC company',
  description: 'Stores not yet linked to any FC company, candidates for 「店舗を紐づけ」.',
  tags: ['FranchiseCompanies'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'FC company ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetFranchiseCompanyLinkableStoresResponseSchema,
      description: 'Linkable stores',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!db.franchiseCompanies.getById(id)) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const stores: FranchiseCompanyLinkedStore[] = db.stores
      .getList()
      .filter((store) => !store.fc_company_id)
      .map((store) => ({
        id: store.id,
        store_id: store.store_id,
        name: store.name,
        brand: store.brand,
        prefecture: store.prefecture ?? null,
        status: store.status,
      }));

    const response: GetFranchiseCompanyLinkableStoresResponse = { stores };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching linkable stores:', error);
    return NextResponse.json({ error: 'Failed to fetch linkable stores' }, { status: 500 });
  }
}
