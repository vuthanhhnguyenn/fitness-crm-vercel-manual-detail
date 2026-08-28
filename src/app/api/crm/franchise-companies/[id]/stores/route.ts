import { NextRequest, NextResponse } from 'next/server';

import { formatOperatorName, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  LinkFranchiseCompanyStoreBodySchema,
  type LinkFranchiseCompanyStoreResponse,
  LinkFranchiseCompanyStoreResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/franchise-companies/{id}/stores',
  summary: 'Link a store to an FC company',
  description: '店舗を紐づけ — assigns an unlinked store to this FC company.',
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
  requestBody: {
    schema: LinkFranchiseCompanyStoreBodySchema,
    description: '紐づける店舗ID',
  },
  responses: [
    { status: 200, schema: LinkFranchiseCompanyStoreResponseSchema, description: 'Linked' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const company = db.franchiseCompanies.getById(id);
    if (!company) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = LinkFranchiseCompanyStoreBodySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const store = db.stores.getById(validation.data.store_id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    if (store.fc_company_id) {
      return NextResponse.json(
        { error: 'この店舗は既に別のFC企業に紐づけられています' },
        { status: 400 },
      );
    }

    db.stores.updateById(store.id, { fc_company_id: id });

    const authResult = getAuthUserFromRequest(request);
    const operator = authResult.ok ? formatOperatorName(authResult.user) : 'システム';
    db.franchiseCompanies.appendHistoryEntry(
      id,
      { changed_item: `店舗紐づけ追加: ${store.name}`, before: null, after: null },
      operator,
    );

    const response: LinkFranchiseCompanyStoreResponse = { message: '店舗を紐づけました' };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error linking store to franchise company:', error);
    return NextResponse.json({ error: 'Failed to link store' }, { status: 500 });
  }
}
