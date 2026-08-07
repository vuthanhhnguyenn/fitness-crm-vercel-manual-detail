import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetMembershipApplicationsQuery,
  GetMembershipApplicationsQuerySchema,
  type GetMembershipApplicationsResponse,
  GetMembershipApplicationsResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for GET route
registerRoute({
  method: 'get',
  path: '/crm/membership-applications',
  summary: 'Get membership applications list',
  description: 'Get paginated list of membership applications with filtering and sorting',
  tags: ['Membership Applications'],
  query: GetMembershipApplicationsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetMembershipApplicationsResponseSchema,
      description: 'List of membership applications',
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

// GET /api/crm/membership-applications - 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetMembershipApplicationsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetMembershipApplicationsQuery = validationResult.data;
    const {
      page,
      limit,
      status,
      brand,
      store,
      blacklist,
      date_from,
      date_to,
      sort_by,
      sort_order,
      search,
    } = query;

    let filtered = db.membershipApplications.getAll();

    if (status) {
      filtered = filtered.filter((app) => app.status === status);
    }

    if (brand) {
      filtered = filtered.filter((app) => app.brand_name === brand);
    }

    if (store) {
      filtered = filtered.filter((app) => app.store_name === store);
    }

    if (blacklist === 'match') {
      filtered = filtered.filter((app) => app.blacklist_match);
    } else if (blacklist === 'no_match') {
      filtered = filtered.filter((app) => !app.blacklist_match);
    }

    if (date_from) {
      filtered = filtered.filter((app) => {
        const appDate = app.application_date.split('T')[0];
        return appDate >= date_from;
      });
    }

    if (date_to) {
      filtered = filtered.filter((app) => {
        const appDate = app.application_date.split('T')[0];
        return appDate <= date_to;
      });
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (app) => app.id.toLowerCase().includes(s) || app.applicant_name.toLowerCase().includes(s),
      );
    }

    filtered.sort((a, b) => {
      const cmp =
        sort_by === 'application_date' ? a.application_date.localeCompare(b.application_date) : 0;
      return sort_order === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const response: GetMembershipApplicationsResponse = {
      applications: paginated,
      pagination: {
        total,
        total_pages,
        current_page: page,
        limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching membership applications:', error);
    return NextResponse.json({ error: 'Failed to fetch membership applications' }, { status: 500 });
  }
}
