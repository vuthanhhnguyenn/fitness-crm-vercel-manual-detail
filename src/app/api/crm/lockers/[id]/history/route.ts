import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetLockerHistoryQuery,
  GetLockerHistoryQuerySchema,
  type GetLockerHistoryResponse,
  GetLockerHistoryResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/{id}/history',
  summary: 'Get locker change history',
  description: 'Get change history for a specific locker',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Locker internal id',
    },
  ],
  query: GetLockerHistoryQuerySchema,
  responses: [
    { status: 200, schema: GetLockerHistoryResponseSchema, description: 'Locker change history' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), 'ja');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const locker = db.lockers.getById(id);
    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetLockerHistoryQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetLockerHistoryQuery = validationResult.data;
    const { page, limit, sort_by = 'date', sort_order = 'desc' } = query;

    const filtered = db.lockers.getHistoryById(id);

    filtered.sort((a, b) => {
      const result = compareValues(a[sort_by], b[sort_by]);
      return sort_order === 'asc' ? result : -result;
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;

    const response: GetLockerHistoryResponse = {
      history: filtered.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching locker history:', error);
    return NextResponse.json({ error: 'Failed to fetch locker history' }, { status: 500 });
  }
}
