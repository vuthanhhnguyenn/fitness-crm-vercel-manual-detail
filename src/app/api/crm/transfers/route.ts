import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetTransfersQuery,
  GetTransfersQuerySchema,
  type GetTransfersResponse,
  GetTransfersResponseSchema,
} from '@/app/api/_schemas/transfer.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/transfers',
  summary: 'Get transfer requests list',
  description: 'Get paginated list of transfer requests with filtering and sorting',
  tags: ['Transfers'],
  query: GetTransfersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetTransfersResponseSchema,
      description: 'List of transfer requests',
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
    const validationResult = GetTransfersQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetTransfersQuery = validationResult.data;
    const {
      page,
      limit,
      search = '',
      status,
      from_store_id,
      to_store_id,
      brand,
      applied_period,
      sort_by = 'applied_at',
      sort_order = 'desc',
    } = query;

    // Get data from shared mock DB
    let filtered = db.transfers.getAll();

    // Apply free-text search on id and member_name
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchLower) ||
          t.member_name.toLowerCase().includes(searchLower),
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Apply from_store_id filter
    if (from_store_id) {
      filtered = filtered.filter((t) => t.from_store_id === from_store_id);
    }

    // Apply to_store_id filter
    if (to_store_id) {
      filtered = filtered.filter((t) => t.to_store_id === to_store_id);
    }

    // Apply brand filter
    if (brand) {
      filtered = filtered.filter((t) => t.brand === brand);
    }

    // Apply applied_period filter
    if (applied_period) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      filtered = filtered.filter((t) => {
        const applied = new Date(t.applied_at);
        if (applied_period === 'this_month') {
          return applied.getFullYear() === year && applied.getMonth() === month;
        }
        if (applied_period === 'last_month') {
          const lastMonth = month === 0 ? 11 : month - 1;
          const lastMonthYear = month === 0 ? year - 1 : year;
          return applied.getFullYear() === lastMonthYear && applied.getMonth() === lastMonth;
        }
        // this_year
        return applied.getFullYear() === year;
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sort_by === 'applied_at') {
        comparison = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      } else if (sort_by === 'scheduled_date') {
        comparison = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
      } else if (sort_by === 'member_name') {
        comparison = a.member_name.localeCompare(b.member_name, 'ja');
      } else if (sort_by === 'id') {
        comparison = a.id.localeCompare(b.id);
      }
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const transfers = filtered.slice(startIndex, startIndex + limit);

    const response: GetTransfersResponse = {
      transfers,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}
