import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetVisitExperiencesQuery,
  GetVisitExperiencesQuerySchema,
  type GetVisitExperiencesResponse,
  GetVisitExperiencesResponseSchema,
} from '@/app/api/_schemas/visit-experience.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/visit-experiences',
  summary: 'Get visit experiences list',
  description: 'Get paginated list of visit/experience reservations with filtering',
  tags: ['Visit Experiences'],
  query: GetVisitExperiencesQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetVisitExperiencesResponseSchema,
      description: 'List of visit experiences',
    },
    {
      status: 400,
      schema: GetVisitExperiencesResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetVisitExperiencesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetVisitExperiencesQuery = validationResult.data;
    const { page, limit, search, status, brand_name, store_name, date_range } = query;

    let filtered = db.visitExperiences.getAll();

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (ve) => ve.id.toLowerCase().includes(s) || ve.customer_name.toLowerCase().includes(s),
      );
    }

    if (status) {
      filtered = filtered.filter((ve) => ve.status === status);
    }

    if (brand_name) {
      filtered = filtered.filter((ve) => ve.brand_name === brand_name);
    }

    if (store_name) {
      filtered = filtered.filter((ve) => ve.store_name === store_name);
    }

    if (date_range) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const cutoff = new Date(now);
      if (date_range === 'today') {
        cutoff.setDate(cutoff.getDate());
      } else if (date_range === 'last_3_days') {
        cutoff.setDate(cutoff.getDate() - 2);
      } else if (date_range === 'last_7_days') {
        cutoff.setDate(cutoff.getDate() - 6);
      }
      filtered = filtered.filter((ve) => {
        const reservedDate = new Date(ve.reserved_at);
        return reservedDate >= cutoff && reservedDate < new Date(now.getTime() + 86400000);
      });
    }

    filtered.sort((a, b) => new Date(b.reserved_at).getTime() - new Date(a.reserved_at).getTime());

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const response: GetVisitExperiencesResponse = {
      items: paginated,
      total,
      page,
      limit,
      total_pages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching visit experiences:', error);
    return NextResponse.json({ error: 'Failed to fetch visit experiences' }, { status: 500 });
  }
}
