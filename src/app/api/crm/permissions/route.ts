import { NextResponse } from 'next/server';

import {
  GetPermissionCatalogResponseSchema,
  buildPermissionCatalog,
} from '@/app/api/_schemas/position.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/permissions',
  summary: 'Get permission catalog',
  description:
    'Full permission catalog (category / permissionKey / label) without a positionId — the source of truth for the position form toggles and the preview item definitions (BE design v0.3)',
  tags: ['Positions'],
  responses: [
    {
      status: 200,
      schema: GetPermissionCatalogResponseSchema,
      description: 'Permission catalog (fixed category order)',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    return NextResponse.json(buildPermissionCatalog(), { status: 200 });
  } catch (error) {
    console.error('GET /crm/permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch permission catalog' }, { status: 500 });
  }
}
