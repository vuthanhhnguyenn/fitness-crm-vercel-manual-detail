import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  StoreHolidaysQuerySchema,
  StoreHolidaysResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/stores/{storeId}/holidays',
  summary: 'Get store holidays',
  description: 'Get store holidays for a date range',
  tags: ['Stores'],
  parameters: [{ name: 'storeId', in: 'path', required: true, description: 'Store ID' }],
  query: StoreHolidaysQuerySchema,
  responses: [
    { status: 200, schema: StoreHolidaysResponseSchema, description: 'Store holidays' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: storeId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const parsed = StoreHolidaysQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.storeHolidays.getHolidays(storeId, parsed.data.from, parsed.data.to);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /crm/stores/[id]/holidays error:', error);
    return NextResponse.json({ error: 'Failed to fetch store holidays' }, { status: 500 });
  }
}
