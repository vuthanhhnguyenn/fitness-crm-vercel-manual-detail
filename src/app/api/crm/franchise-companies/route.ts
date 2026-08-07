import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  CreateFranchiseCompanyBodySchema,
  type CreateFranchiseCompanyResponse,
  CreateFranchiseCompanyResponseSchema,
  type FranchiseCompanyListItem,
  type GetFranchiseCompaniesQuery,
  GetFranchiseCompaniesQuerySchema,
  type GetFranchiseCompaniesResponse,
  GetFranchiseCompaniesResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/franchise-companies',
  summary: 'Get franchise companies',
  description: 'Get paginated list of FC companies for Y-03 FR-001',
  tags: ['FranchiseCompanies'],
  query: GetFranchiseCompaniesQuerySchema,
  responses: [
    { status: 200, schema: GetFranchiseCompaniesResponseSchema, description: 'Company list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/franchise-companies',
  summary: 'Create franchise company',
  description: 'Create a new FC company for Y-03 FR-002',
  tags: ['FranchiseCompanies'],
  requestBody: {
    schema: CreateFranchiseCompanyBodySchema,
    description: 'FC企業作成リクエスト',
  },
  responses: [
    { status: 201, schema: CreateFranchiseCompanyResponseSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function sortCompanies(
  companies: FranchiseCompanyListItem[],
  sortBy: GetFranchiseCompaniesQuery['sort_by'],
  sortOrder: GetFranchiseCompaniesQuery['sort_order'],
) {
  const next = [...companies];
  next.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const comparison =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'ja');
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  return next;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetFranchiseCompaniesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetFranchiseCompaniesQuery = validationResult.data;
    const currentStaff = user.staff_id
      ? db.staffs.getList().find((staff) => staff.staff_id === user.staff_id)
      : undefined;
    const allowedCompanyId =
      user.role === 'Staff' ? (currentStaff?.linked_fc_company_id ?? null) : null;

    if (user.role === 'Staff' && !allowedCompanyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let filtered: FranchiseCompanyListItem[] = db.franchiseCompanies.getList().map((company) => ({
      id: company.id,
      display_name: company.display_name,
      type: company.type,
      managed_store_count: company.managed_store_count,
      status: company.status,
    }));

    if (allowedCompanyId) {
      filtered = filtered.filter((row) => row.id === allowedCompanyId);
    }

    if (query.search) {
      const keyword = query.search.toLowerCase().trim();
      filtered = filtered.filter((item) => item.display_name.toLowerCase().includes(keyword));
    }

    if (query.company_type) {
      filtered = filtered.filter((item) => item.type === query.company_type);
    }

    if (query.status) {
      filtered = filtered.filter((item) => item.status === query.status);
    }

    const sorted = sortCompanies(filtered, query.sort_by, query.sort_order);
    const total = sorted.length;
    const total_pages = Math.ceil(total / query.limit) || 0;
    const start = (query.page - 1) * query.limit;
    const franchise_companies = sorted.slice(start, start + query.limit);

    const response: GetFranchiseCompaniesResponse = {
      franchise_companies,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching franchise companies:', error);
    return NextResponse.json({ error: 'Failed to fetch franchise companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CreateFranchiseCompanyBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const franchise_company = db.franchiseCompanies.create({
      ...validationResult.data,
      formal_name: validationResult.data.formal_name.trim(),
      display_name:
        validationResult.data.display_name.trim() || validationResult.data.formal_name.trim(),
    });

    const response: CreateFranchiseCompanyResponse = {
      message: 'FC企業を作成しました',
      franchise_company,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST /crm/franchise-companies error:', error);
    return NextResponse.json({ error: 'Failed to create franchise company' }, { status: 500 });
  }
}
