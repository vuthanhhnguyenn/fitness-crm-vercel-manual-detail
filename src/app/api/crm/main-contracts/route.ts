import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateMainContractResponseSchema,
  ErrorResponseSchema,
  type GetMainContractsQuery,
  GetMainContractsQuerySchema,
  type GetMainContractsResponse,
  GetMainContractsResponseSchema,
  type MainContractListItem,
  UpsertMainContractBodySchema,
} from '@/app/api/_schemas/main-contract.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/main-contracts',
  summary: 'Get main contract masters',
  description: 'Get paginated list of main contract masters (G-01)',
  tags: ['Main Contracts'],
  query: GetMainContractsQuerySchema,
  responses: [
    { status: 200, schema: GetMainContractsResponseSchema, description: 'Main contract list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetMainContractsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetMainContractsQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      contract_type,
      brand,
      status,
      companion_benefit_enabled,
      sort_by,
      sort_order,
    } = query;

    let filtered: MainContractListItem[] = [...db.mainContracts.getList()];

    if (search) {
      const keyword = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword) ||
          item.code.toLowerCase().includes(keyword) ||
          (item.old_code ?? '').toLowerCase().includes(keyword),
      );
    }
    if (contract_type) {
      filtered = filtered.filter((item) => item.contract_type === contract_type);
    }
    if (brand) {
      filtered = filtered.filter((item) => item.brand === brand);
    }
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (companion_benefit_enabled !== undefined) {
      filtered = filtered.filter(
        (item) => item.companion_benefit_enabled === companion_benefit_enabled,
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sort_by] ?? '';
      const bVal = b[sort_by] ?? '';
      const comparison =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'ja');
      return sort_order === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;
    const main_contracts = filtered.slice(start, start + limit);

    const response: GetMainContractsResponse = {
      main_contracts,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching main contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch main contracts' }, { status: 500 });
  }
}

registerRoute({
  method: 'post',
  path: '/crm/main-contracts',
  summary: 'Create a main contract',
  description: 'Create a new main contract master (G-01)',
  tags: ['Main Contracts'],
  requestBody: { schema: UpsertMainContractBodySchema, description: '主契約作成リクエスト' },
  responses: [
    { status: 201, schema: CreateMainContractResponseSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UpsertMainContractBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validationResult.data;
    const newId = `MC${String(db.mainContracts.getList().length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newContract = {
      id: newId,
      name: data.name,
      code: data.code,
      old_code: data.old_code ?? null,
      contract_type: data.contract_type,
      brand: data.brand,
      status: data.status ?? 'active',
      companion_benefit_enabled: data.companion_benefit_enabled ?? false,
      other_store_usage: data.other_store_usage ?? 'none',
      changeability: data.changeability ?? '可',
      previous_contract: null,
      billing_enabled: data.billing_enabled ?? false,
      modifiable: data.modifiable ?? '可',
      initial_payment_months: data.initial_payment_months ?? 1,
      same_day_cancellation: data.same_day_cancellation ?? false,
      family_contract_allowed: data.family_contract_allowed ?? false,
      suspension_monthly_limit: data.suspension_monthly_limit ?? null,
      usage_schedule: '',
      company: data.company ?? null,
      regulation: data.regulation ?? null,
      public_name: data.public_name ?? data.name,
      public_description: data.public_description ?? '',
      memo: data.memo ?? null,
      price_including_tax: data.price_including_tax ?? 0,
      suspension_fee: data.suspension_fee ?? 0,
      tax_rate: data.tax_rate ?? 10,
      start_date: data.start_date ?? now.slice(0, 10),
      monthly_limit: data.monthly_limit ?? null,
      usage_hours_by_day: data.usage_hours_by_day ?? [],
      suspendable_months: data.suspendable_months ?? '',
      cancellable_months: data.cancellable_months ?? '',
      accounting_code: data.accounting_code ?? '',
      age_restriction: data.age_restriction ?? '',
      gender_restriction: data.gender_restriction ?? '制限なし',
      store_range: '',
      thumbnail_url: null,
      description: data.description ?? '',
      created_at: now,
      updated_at: now,
      active_contracts: 0,
      enabled_stores: 0,
      total_stores: 0,
      target_store_name: null,
      parent_contract_id: data.parent_contract_id ?? null,
      parent_contract_name: null,
      child_contracts: [],
    };

    db.mainContracts.add(newContract);

    return NextResponse.json(
      { message: '主契約を作成しました', main_contract: newContract },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating main contract:', error);
    return NextResponse.json({ error: 'Failed to create main contract' }, { status: 500 });
  }
}
