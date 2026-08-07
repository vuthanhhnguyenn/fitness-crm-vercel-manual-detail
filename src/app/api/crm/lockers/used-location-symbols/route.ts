import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetLockerUsedLocationSymbolsQuerySchema,
  type GetLockerUsedLocationSymbolsResponse,
  GetLockerUsedLocationSymbolsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/used-location-symbols',
  summary: 'Get used locker location symbols',
  description: 'Get location symbols already used by lockers in a store',
  tags: ['Lockers'],
  query: GetLockerUsedLocationSymbolsQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetLockerUsedLocationSymbolsResponseSchema,
      description: 'Used location symbols',
    },
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

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetLockerUsedLocationSymbolsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { store_id, exclude_locker_id } = validationResult.data;
    const location_symbols = db.lockers.getUsedLocationSymbols(store_id, exclude_locker_id);

    const response: GetLockerUsedLocationSymbolsResponse = { location_symbols };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching used location symbols:', error);
    return NextResponse.json({ error: 'Failed to fetch used location symbols' }, { status: 500 });
  }
}
