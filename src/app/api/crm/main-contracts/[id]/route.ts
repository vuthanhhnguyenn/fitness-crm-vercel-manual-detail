import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteMainContractRequestSchema,
  DeleteMainContractResponseSchema,
  ErrorResponseSchema,
  GetMainContractDetailResponseSchema,
  UpdateMainContractResponseSchema,
  UpsertMainContractBodySchema,
} from '@/app/api/_schemas/main-contract.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/main-contracts/{id}',
  summary: 'Get main contract detail',
  description: 'Get detailed information about a specific main contract master',
  tags: ['Main Contracts'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Main contract ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetMainContractDetailResponseSchema,
      description: 'Main contract detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/main-contracts/{id}',
  summary: 'Delete a main contract',
  description:
    'Delete a main contract master by ID. Only allowed when active_contracts = 0 and child_contracts is empty.',
  tags: ['Main Contracts'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Main contract ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: DeleteMainContractRequestSchema,
    description: '削除理由',
  },
  responses: [
    { status: 200, schema: DeleteMainContractResponseSchema, description: 'Deleted successfully' },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error or deletion blocked',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = db.mainContracts.getById(id);
    if (!detail) {
      return NextResponse.json({ error: 'Main contract not found' }, { status: 404 });
    }
    return NextResponse.json({ main_contract: detail }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/main-contracts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const validation = DeleteMainContractRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const detail = db.mainContracts.getById(id);
    if (!detail) {
      return NextResponse.json({ error: '主契約が見つかりません' }, { status: 404 });
    }

    if (detail.active_contracts > 0) {
      return NextResponse.json(
        {
          error: `契約者が ${detail.active_contracts.toLocaleString()} 名存在するため削除できません`,
        },
        { status: 400 },
      );
    }

    if (detail.child_contracts.length > 0) {
      return NextResponse.json(
        { error: `派生マスタが ${detail.child_contracts.length} 件存在するため削除できません` },
        { status: 400 },
      );
    }

    const deleted = db.mainContracts.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: '主契約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: '主契約を削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/main-contracts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/main-contracts/{id}',
  summary: 'Update a main contract',
  description: 'Update an existing main contract master by ID',
  tags: ['Main Contracts'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Main contract ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: { schema: UpsertMainContractBodySchema, description: '主契約更新リクエスト' },
  responses: [
    { status: 200, schema: UpdateMainContractResponseSchema, description: 'Updated successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = UpsertMainContractBodySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const existing = db.mainContracts.getById(id);
    if (!existing) {
      return NextResponse.json({ error: '主契約が見つかりません' }, { status: 404 });
    }

    const data = validation.data;
    const updated = db.mainContracts.update(id, {
      name: data.name,
      code: data.code,
      old_code: data.old_code ?? existing.old_code,
      contract_type: data.contract_type,
      brand: data.brand,
      status: data.status ?? existing.status,
      companion_benefit_enabled:
        data.companion_benefit_enabled ?? existing.companion_benefit_enabled,
      other_store_usage: data.other_store_usage ?? existing.other_store_usage,
      changeability: data.changeability ?? existing.changeability,
      billing_enabled: data.billing_enabled ?? existing.billing_enabled,
      modifiable: data.modifiable ?? existing.modifiable,
      initial_payment_months: data.initial_payment_months ?? existing.initial_payment_months,
      same_day_cancellation: data.same_day_cancellation ?? existing.same_day_cancellation,
      family_contract_allowed: data.family_contract_allowed ?? existing.family_contract_allowed,
      suspension_monthly_limit: data.suspension_monthly_limit ?? existing.suspension_monthly_limit,
      company: data.company ?? existing.company,
      regulation: data.regulation ?? existing.regulation,
      public_name: data.public_name ?? existing.public_name,
      public_description: data.public_description ?? existing.public_description,
      memo: data.memo ?? existing.memo,
      price_including_tax: data.price_including_tax ?? existing.price_including_tax,
      suspension_fee: data.suspension_fee ?? existing.suspension_fee,
      tax_rate: data.tax_rate ?? existing.tax_rate,
      start_date: data.start_date ?? existing.start_date,
      monthly_limit: data.monthly_limit ?? existing.monthly_limit,
      usage_hours_by_day: data.usage_hours_by_day ?? existing.usage_hours_by_day,
      suspendable_months: data.suspendable_months ?? existing.suspendable_months,
      cancellable_months: data.cancellable_months ?? existing.cancellable_months,
      accounting_code: data.accounting_code ?? existing.accounting_code,
      age_restriction: data.age_restriction ?? existing.age_restriction,
      gender_restriction: data.gender_restriction ?? existing.gender_restriction,
      description: data.description ?? existing.description,
    });

    if (!updated) {
      return NextResponse.json({ error: '主契約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      { message: '主契約を更新しました', main_contract: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/main-contracts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
