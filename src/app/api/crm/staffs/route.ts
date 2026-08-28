import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  type CreateStaffsRequest,
  CreateStaffsRequestSchema,
  type CreateStaffsResponse,
  CreateStaffsResponseSchema,
  ErrorResponseSchema,
  type GetStaffsQuery,
  GetStaffsQuerySchema,
  type GetStaffsResponse,
  GetStaffsResponseSchema,
} from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/staffs',
  summary: 'Get staffs list',
  description: 'Get paginated list of staff members with filtering and sorting',
  tags: ['Staffs'],
  query: GetStaffsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetStaffsResponseSchema,
      description: 'List of staff members',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/staffs',
  summary: 'Bulk-create staff accounts',
  description: 'Register one or more new staff accounts in a single request (スタッフ新規登録)',
  tags: ['Staffs'],
  requestBody: {
    schema: CreateStaffsRequestSchema,
    description: 'Bulk staff creation payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateStaffsResponseSchema,
      description: 'Staff accounts created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid request body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    {
      status: 422,
      schema: ErrorResponseSchema,
      description: 'Validation failure (e.g. duplicate email)',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const caller = authResult.user;

    const searchParams = request.nextUrl.searchParams;

    // Build query object from searchParams
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    // Validate query parameters with Zod
    const validationResult = GetStaffsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetStaffsQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      role,
      brand,
      status,
      position_id,
      store_id,
      sort_by = 'staff_id',
      sort_order = 'asc',
    } = query;

    // Get data from shared mock DB
    let filtered = db.staffs.getList();

    // System-role accounts are 開発・運用チーム専用 (dev/ops only) and are never shown in the
    // staff directory — per the Y-01 permission matrix their role display is literally "（非表示）".
    filtered = filtered.filter((s) => s.role !== 'system');

    // Server-side scoping by caller role (FR-004) — headquarters/system see everything,
    // manager sees only staff at their managed stores, everyone else sees only their own row.
    if (caller.role === 'Manager') {
      const managedStoreIds = new Set(caller.managed_store_ids ?? []);
      filtered = filtered.filter(
        (s) => s.linked_store_id != null && managedStoreIds.has(s.linked_store_id),
      );
    } else if (caller.role !== 'System' && caller.role !== 'Headquarter') {
      filtered = filtered.filter((s) => s.staff_id === caller.staff_id);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.staff_id.toLowerCase().includes(searchLower),
      );
    }

    // Apply role filter
    if (role) {
      filtered = filtered.filter((s) => s.role === role);
    }

    // Apply brand filter
    if (brand) {
      filtered = filtered.filter((s) => s.brand === brand);
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (position_id != null) {
      filtered = filtered.filter((s) => s.position_id === position_id);
    }

    if (store_id) {
      filtered = filtered.filter((s) => s.linked_store_id === store_id);
    }

    // Apply sorting — last_login sorts nulls last regardless of direction
    filtered = [...filtered].sort((a, b) => {
      if (sort_by === 'last_login') {
        if (a.last_login == null && b.last_login == null) return 0;
        if (a.last_login == null) return 1;
        if (b.last_login == null) return -1;
        return sort_order === 'asc'
          ? a.last_login.localeCompare(b.last_login)
          : b.last_login.localeCompare(a.last_login);
      }
      const aVal = a[sort_by as keyof typeof a] ?? '';
      const bVal = b[sort_by as keyof typeof b] ?? '';
      if (aVal < bVal) return sort_order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort_order === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStaffs = filtered.slice(startIndex, endIndex);

    const response: GetStaffsResponse = {
      staffs: paginatedStaffs,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching staffs:', error);
    return NextResponse.json({ error: 'Failed to fetch staffs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateStaffsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validated: CreateStaffsRequest = validationResult.data;
    const existingEmails = new Set(db.staffs.getList().map((s) => s.email.toLowerCase()));
    const seenInBatch = new Set<string>();
    const rowErrors: string[] = [];

    validated.staff.forEach((row, index) => {
      const email = row.email.toLowerCase();
      if (existingEmails.has(email)) {
        rowErrors.push(`${index + 1}行目: このメールアドレスはすでに登録されています`);
      } else if (seenInBatch.has(email)) {
        rowErrors.push(`${index + 1}行目: リスト内でメールアドレスが重複しています`);
      }
      seenInBatch.add(email);
    });

    if (rowErrors.length > 0) {
      return NextResponse.json({ error: rowErrors.join(', ') }, { status: 422 });
    }

    const created = db.staffs.createBatch({
      staff: validated.staff,
      role: validated.role,
      position_id: validated.position_id,
      staff_linkage: validated.staff_linkage,
      note: validated.note,
    });

    const response: CreateStaffsResponse = {
      message: `${created.length}名のスタッフを登録しました`,
      created_count: created.length,
      staffs: created,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating staffs:', error);
    return NextResponse.json({ error: 'スタッフの登録に失敗しました' }, { status: 500 });
  }
}
