import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetRoutineCategoriesResponseSchema } from '@/app/api/_schemas/routine-category.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/routine.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/routine-categories',
  summary: 'Get routine categories',
  description: 'Get the fixed list of routine categories (read-only reference data)',
  tags: ['Routines'],
  responses: [
    { status: 200, schema: GetRoutineCategoriesResponseSchema, description: 'Routine categories' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    return NextResponse.json(db.routineCategories.list(), { status: 200 });
  } catch (error) {
    console.error('GET /crm/routine-categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch routine categories' }, { status: 500 });
  }
}
