import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetBlacklistByIdResponseSchema,
} from '@/app/api/_schemas/blacklist.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { guardBlacklistRequest } from '@/app/api/crm/blacklist/_lib/guard';

// ─── GET /crm/blacklist/{id} ──────────────────────────────────────────────────

registerRoute({
  method: 'get',
  path: '/crm/blacklist/{id}',
  summary: 'Get blacklist entry by ID',
  description:
    'A-01 FR-015 — one blacklist entry with its widened member block and its registered/removed history. A **released** entry still resolves here: release flips `is_active` and never deletes, so a held URL keeps working (FR-069a).',
  tags: ['Blacklist'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetBlacklistByIdResponseSchema,
      description: 'Blacklist entry detail',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // FR-001 – FR-003 — the direct-URL route is refused for non-HQ callers at the endpoint too.
  const guard = guardBlacklistRequest(request);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const row = db.memberBlacklist.getById(id);

  if (!row) {
    // Japanese, like every other failure message in this feature: the client surfaces
    // the server's `error` field verbatim in a toast.
    return NextResponse.json(
      { error: '指定されたブラックリスト登録が見つかりません。' },
      { status: 404 },
    );
  }

  return NextResponse.json({ blacklist: row }, { status: 200 });
}
