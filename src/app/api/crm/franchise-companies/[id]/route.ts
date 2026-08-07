import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type DeleteFranchiseCompanyResponse,
  DeleteFranchiseCompanyResponseSchema,
  type FranchiseCompanyLinkedStore,
  type GetFranchiseCompanyDetailResponse,
  GetFranchiseCompanyDetailResponseSchema,
  UpdateFranchiseCompanyBodySchema,
  type UpdateFranchiseCompanyResponse,
  UpdateFranchiseCompanyResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/franchise-companies/{id}',
  summary: 'Get franchise company detail',
  description: 'Get detail data for a single FC company, including linked stores and history.',
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
    { status: 200, schema: GetFranchiseCompanyDetailResponseSchema, description: 'Detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/franchise-companies/{id}',
  summary: 'Update franchise company',
  description: 'Update franchise company basic info for the detail/edit flow.',
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
    schema: UpdateFranchiseCompanyBodySchema,
    description: 'FC企業更新リクエスト',
  },
  responses: [
    { status: 200, schema: UpdateFranchiseCompanyResponseSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/franchise-companies/{id}',
  summary: 'Delete franchise company',
  description: 'Delete an FC company when business rules allow it.',
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
    { status: 200, schema: DeleteFranchiseCompanyResponseSchema, description: 'Deleted' },
    { status: 400, schema: ErrorResponseSchema, description: 'Deletion blocked' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function buildLinkedStores(companyId: string): FranchiseCompanyLinkedStore[] {
  return db.stores
    .getList()
    .filter((store) => store.fc_company_id === companyId)
    .map((store) => ({
      id: store.id,
      store_id: store.store_id,
      name: store.name,
      brand: store.brand,
      prefecture: store.prefecture ?? null,
      status: store.status,
    }));
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const company = db.franchiseCompanies.getById(id);

    if (!company) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const response: GetFranchiseCompanyDetailResponse = {
      franchise_company: {
        id: company.id,
        formal_name: company.formal_name,
        display_name: company.display_name,
        type: company.type,
        direct_owned_flag: company.direct_owned_flag,
        corporate_number: company.corporate_number,
        representative_name: company.representative_name,
        head_office_address: company.head_office_address,
        phone: company.phone,
        contact_person: company.contact_person,
        contact_phone: company.contact_phone,
        fc_contract_start_date: company.fc_contract_start_date,
        fc_contract_renewal_date: company.fc_contract_renewal_date,
        royalty_rate: company.royalty_rate,
        note: company.note,
        managed_store_count: company.managed_store_count,
        status: company.status,
        created_at: company.created_at,
        updated_at: company.updated_at,
      },
      linked_stores: buildLinkedStores(id),
      history: db.franchiseCompanies.getHistory(id),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching franchise company detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchise company detail' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = UpdateFranchiseCompanyBodySchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.franchiseCompanies.update(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const response: UpdateFranchiseCompanyResponse = {
      message: 'FC企業を更新しました',
      franchise_company: updated,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating franchise company:', error);
    return NextResponse.json({ error: 'Failed to update franchise company' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const company = db.franchiseCompanies.getById(id);
    if (!company) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    if (company.managed_store_count > 0) {
      return NextResponse.json({ error: '管轄店舗があるため削除できません' }, { status: 400 });
    }

    const deleted = db.franchiseCompanies.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const response: DeleteFranchiseCompanyResponse = {
      message: 'FC企業を削除しました',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting franchise company:', error);
    return NextResponse.json({ error: 'Failed to delete franchise company' }, { status: 500 });
  }
}
