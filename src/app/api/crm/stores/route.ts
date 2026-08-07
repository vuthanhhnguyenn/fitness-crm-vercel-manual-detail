import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CreateStoreResponseSchema,
  ErrorResponseSchema,
  type GetStoresQuery,
  GetStoresQuerySchema,
  type GetStoresResponse,
  GetStoresResponseSchema,
  type Store,
  UpsertStorePayloadSchema,
} from '@/app/api/_schemas/store.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores',
  summary: 'Get stores list',
  description: 'Get paginated list of stores with filtering and sorting',
  tags: ['Stores'],
  query: GetStoresQuerySchema,
  responses: [
    { status: 200, schema: GetStoresResponseSchema, description: 'List of stores' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/stores',
  summary: 'Create store',
  description: 'Create a new store',
  tags: ['Stores'],
  requestBody: {
    schema: UpsertStorePayloadSchema,
    description: 'Store create payload',
  },
  responses: [
    { status: 200, schema: CreateStoreResponseSchema, description: 'Store created successfully' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);
    // Empty array means the role has no access to any store
    if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetStoresQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetStoresQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      brand,
      area,
      status: statusFilter,
      sort_by = 'store_id',
      sort_order = 'asc',
    } = query;

    let filtered: Store[] = [...db.stores.getList()];

    // Restrict Staff users to only their linked stores
    if (allowedStoreIds !== null) {
      filtered = filtered.filter((s) => allowedStoreIds.includes(s.id));
    }

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.club_code ?? '').toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.store_id.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          (s.area ?? '').toLowerCase().includes(q) ||
          (s.operating_company_name ?? '').toLowerCase().includes(q),
      );
    }

    if (brand) {
      filtered = filtered.filter((s) => s.brand === brand);
    }
    if (area) {
      filtered = filtered.filter((s) => s.area === area);
    }
    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    const sortKey = sort_by as keyof Store;
    filtered.sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ja');
      return sort_order === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;
    const stores = filtered.slice(start, start + limit);

    const response: GetStoresResponse = {
      stores,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UpsertStorePayloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const payload = validationResult.data;
    const created = db.stores.create({
      club_code: payload.club_code,
      name: payload.name,
      brand: payload.brand,
      area: payload.area,
      operating_company_name: payload.operating_company_name,
      status: payload.status,
      fc_company_id: (payload.is_fc ?? false) ? 'fc-001' : null,
      manager_staff_id: null,
      main_contract_id: null,
      main_contract_status: null,
      option_pass_price: 0,
      mutual_use_enabled: false,
      mutual_use_type: 'none',
      closing_date: null,
      locker_map_id: null,
      asset_id: null,
      created_by: 'STF-001',
      updated_by: 'STF-001',
      postal_code: payload.postal_code,
      prefecture: payload.prefecture,
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      accounting_code: payload.accounting_code,
      interview_url: payload.interview_url,
      google_map_url: payload.google_map_url,
      x_url: payload.x_url,
      instagram_url: payload.instagram_url,
      line_url: payload.line_url,
      facebook_url: payload.facebook_url,
      youtube_url: payload.youtube_url,
      store_photos: payload.store_photos,
      floor_map_url: payload.floor_map_url,
    });

    return NextResponse.json({
      message: '店舗を作成しました',
      store: created,
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
