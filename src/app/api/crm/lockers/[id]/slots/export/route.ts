import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type ExportLockerSlotsRequest,
  ExportLockerSlotsRequestSchema,
  type ExportLockerSlotsResponse,
  ExportLockerSlotsResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { filterLockerSlotsForExport } from '../../../_utils/locker-csv-export.util';

registerRoute({
  method: 'post',
  path: '/crm/lockers/{id}/slots/export',
  summary: 'Export locker slot list',
  description:
    'Export locker slot assignment list data for the locker detail slots tab, respecting the pending-only filter',
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
  requestBody: {
    schema: ExportLockerSlotsRequestSchema,
    description: 'Export filters',
  },
  responses: [
    {
      status: 200,
      schema: ExportLockerSlotsResponseSchema,
      description: 'Locker slot list export data',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Locker not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = ExportLockerSlotsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const exportRequest: ExportLockerSlotsRequest = validationResult.data;
    const locker = db.lockers.getDetailById(id);
    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }

    const slots = filterLockerSlotsForExport(
      locker.slot_items,
      exportRequest.pending_only ?? false,
    );
    const response: ExportLockerSlotsResponse = { slots };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting locker slots:', error);
    return NextResponse.json({ error: 'Failed to export locker slots' }, { status: 500 });
  }
}
