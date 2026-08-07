import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
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

export async function GET(request: NextRequest) {
  try {
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
      sort_by = 'staff_id',
      sort_order = 'asc',
    } = query;

    // Get data from shared mock DB
    let filtered = db.staffs.getList();

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

    // Apply sorting
    filtered.sort((a, b) => {
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
