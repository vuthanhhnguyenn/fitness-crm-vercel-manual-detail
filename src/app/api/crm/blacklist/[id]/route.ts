import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetBlacklistByIdResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// ─── GET /crm/blacklist/{id} ──────────────────────────────────────────────────

registerRoute({
  method: 'get',
  path: '/crm/blacklist/{id}',
  summary: 'Get blacklist entry by ID',
  description: 'Get a single blacklist entry with full detail including match conditions',
  tags: ['Blacklist'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetBlacklistByIdResponseSchema,
      description: 'Blacklist entry detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db.memberBlacklist.getById(id);

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ blacklist: row }, { status: 200 });
}
