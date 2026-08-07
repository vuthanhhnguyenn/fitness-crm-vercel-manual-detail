import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateOptionMasterResponseSchema,
  ErrorResponseSchema,
  type GetOptionMastersQuery,
  GetOptionMastersQuerySchema,
  type GetOptionMastersResponse,
  GetOptionMastersResponseSchema,
  type OptionMasterListItem,
  UpsertOptionMasterBodySchema,
} from '@/app/api/_schemas/option-master.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/options',
  summary: 'Get option masters',
  description: 'Get paginated list of option masters (G-02)',
  tags: ['Options'],
  query: GetOptionMastersQuerySchema,
  responses: [
    { status: 200, schema: GetOptionMastersResponseSchema, description: 'Option list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/options',
  summary: 'Create option master',
  description: 'Create a new option master (G-02)',
  tags: ['Options'],
  requestBody: {
    schema: UpsertOptionMasterBodySchema,
    description: 'オプション作成リクエスト',
  },
  responses: [
    { status: 201, schema: CreateOptionMasterResponseSchema, description: 'Created' },
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

    const validationResult = GetOptionMastersQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetOptionMastersQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      brand,
      option_type,
      status,
      category,
      store_id,
      sort_by,
      sort_order,
    } = query;

    let filtered: OptionMasterListItem[] = [...db.optionMasters.getList()];

    if (search) {
      const keyword = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword) ||
          item.code.toLowerCase().includes(keyword),
      );
    }
    if (brand) {
      filtered = filtered.filter((item) => item.brand === brand);
    }
    if (option_type) {
      filtered = filtered.filter((item) => item.option_type === option_type);
    }
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }
    if (store_id) {
      filtered = filtered.filter((item) => item.store_id === store_id || item.store_id === null);
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
    const options = filtered.slice(start, start + limit);

    const response: GetOptionMastersResponse = {
      options,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching options:', error);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UpsertOptionMasterBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const option = db.optionMasters.add(validationResult.data);

    return NextResponse.json({ message: 'オプションを作成しました', option }, { status: 201 });
  } catch (error) {
    console.error('POST /crm/options error:', error);
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500 });
  }
}
