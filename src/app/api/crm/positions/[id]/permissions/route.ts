import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetPositionPermissionsResponseSchema } from '@/app/api/_schemas/position.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/positions/{id}/permissions',
  summary: 'Get position permission preview',
  description:
    'Position permissions grouped into the 10 fixed-order UI categories for the preview pane (Y-01 FR-009). Category keys follow BE design v0.3, csv_export included (FR-S001). The catalog without granted state is served by GET /crm/permissions',
  tags: ['Positions'],
  parameters: [
    {
      name: 'id',
      in: 'path' as const,
      required: true,
      description: 'Position ID',
      schema: { type: 'integer' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetPositionPermissionsResponseSchema,
      description: 'Permission preview (10 categories, fixed order)',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    const preview =
      Number.isInteger(id) && id > 0 ? db.positions.getPermissionsPreview(id) : undefined;

    if (!preview) {
      return NextResponse.json(
        { error: '職位が見つかりません', code: 'E-STF-009' },
        { status: 404 },
      );
    }
    return NextResponse.json(preview, { status: 200 });
  } catch (error) {
    console.error('GET /crm/positions/[id]/permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch position permissions' }, { status: 500 });
  }
}
