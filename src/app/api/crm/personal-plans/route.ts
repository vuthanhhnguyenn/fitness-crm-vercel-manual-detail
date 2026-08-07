import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetPersonalPlansQuery,
  GetPersonalPlansQuerySchema,
  type GetPersonalPlansResponse,
  GetPersonalPlansResponseSchema,
  type PersonalPlanItem,
} from '@/app/api/_schemas/lesson-content.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/personal-plans',
  summary: 'Get personal training plans list',
  description: 'Get paginated personal training plans with filtering and sorting',
  tags: ['LessonContents'],
  query: GetPersonalPlansQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetPersonalPlansResponseSchema,
      description: 'List of personal plans',
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
    const queryObj: Record<string, string | string[]> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      const existing = queryObj[key];
      if (existing === undefined) {
        queryObj[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        queryObj[key] = [existing, value];
      }
    });

    const validationResult = GetPersonalPlansQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetPersonalPlansQuery = validationResult.data;
    const {
      page,
      limit,
      search,
      category,
      brand,
      status,
      include_deleted,
      store_id,
      sort_by,
      sort_order,
    } = query;

    let rows: PersonalPlanItem[] = db.personalPlans.getList();

    // 1. Store scope
    if (store_id) {
      rows = rows.filter((row) => row.store_id === store_id);
    }

    // 2. Search (partial match on name or id, case-insensitive)
    if (search) {
      const term = search.toLowerCase().trim();
      rows = rows.filter(
        (row) => row.name.toLowerCase().includes(term) || row.id.toLowerCase().includes(term),
      );
    }

    // 3. Detailed filters
    if (category && category.length > 0) {
      rows = rows.filter((row) => category.includes(row.category));
    }
    if (brand && brand.length > 0) {
      rows = rows.filter((row) => brand.includes(row.brand));
    }
    if (status && status.length > 0) {
      rows = rows.filter((row) => status.includes(row.status));
    }

    // 4. Include-deleted toggle
    if (!include_deleted) {
      rows = rows.filter((row) => !row.is_deleted && row.status !== 'inactive');
    }

    // 5. Sort
    rows = [...rows].sort((a, b) => {
      let comparison = 0;
      switch (sort_by) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ja');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category, 'ja');
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'id':
        default:
          comparison = a.id.localeCompare(b.id);
          break;
      }
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // 6. Paginate
    const total = rows.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = rows.slice(startIndex, startIndex + limit);

    const response: GetPersonalPlansResponse = {
      data: paginated,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching personal plans:', error);
    return NextResponse.json({ error: 'Failed to fetch personal plans' }, { status: 500 });
  }
}
