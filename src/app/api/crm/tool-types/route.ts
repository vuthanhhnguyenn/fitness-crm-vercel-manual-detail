import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ListToolTypesQuerySchema,
  ListToolTypesResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/tool-types',
  summary: 'List equipment-type master (`mst_tools`)',
  description:
    'Returns the mst_tools taxonomy for registration/filter dropdowns. Read-only flat array sorted sort_order ASC.',
  tags: ['Training Equipment Management'],
  query: ListToolTypesQuerySchema,
  responses: [
    {
      status: 200,
      schema: ListToolTypesResponseSchema,
      description: 'Tool-type list',
    },
  ],
});

export async function GET(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const parsed = ListToolTypesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const items = db.toolTypes.list({
    includeNone: parsed.data.includeNone,
    includeInactive: parsed.data.includeInactive,
  });

  return NextResponse.json({ items });
}
