import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type MemberFeeAdjustmentInternal,
  type MemberRow,
  applyFeeAdjustment,
} from '@/app/api/_mock-db/seeds/membership.seed';
import {
  AddFeeAdjustmentRequestSchema,
  AddFeeAdjustmentResponseSchema,
  ErrorResponseSchema,
  GetFeeAdjustmentsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatISODateLocal } from '@/utils/date.util';
import { endOfMonth } from 'date-fns';

// Register OpenAPI documentation for this route (GET)
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/fee-adjustments',
  summary: 'Get member fee adjustments',
  description: 'Get individual fee-adjustment history for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetFeeAdjustmentsResponseSchema,
      description: 'Fee-adjustment history',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// Register OpenAPI documentation for this route (POST)
registerRoute({
  method: 'post',
  path: '/crm/members/{id}/fee-adjustments',
  summary: 'Add a member fee adjustment',
  description: 'Add an individual fee adjustment for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: AddFeeAdjustmentRequestSchema,
    description: 'Fee-adjustment payload',
  },
  responses: [
    {
      status: 200,
      schema: AddFeeAdjustmentResponseSchema,
      description: 'Created fee-adjustment record',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

function toFeeAdjustmentItem(record: MemberFeeAdjustmentInternal) {
  return {
    id: record.id,
    startDate: record.startDate,
    endDate: record.endDate,
    pattern: record.pattern,
    value: record.value,
    reason: record.reason,
    setBy: record.setBy,
    status: record.status,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const row = member as MemberRow;
    const records = row._feeAdjustments ?? [];

    const mockData = GetFeeAdjustmentsResponseSchema.parse({
      items: records.map(toFeeAdjustmentItem),
    });

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('[GET /crm/members/[id]/fee-adjustments]', error);
    return NextResponse.json({ error: 'Failed to fetch fee adjustments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = AddFeeAdjustmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { start_month, end_month, pattern, value, reason } = validationResult.data;
    // The UI picks months (YYYY-MM); records keep full dates (first day .. last day of month)
    const startDate = `${start_month}-01`;
    const endDate = formatISODateLocal(endOfMonth(new Date(`${end_month}-01T00:00:00`)));

    const row = member as MemberRow;
    if (!row._feeAdjustments) {
      row._feeAdjustments = [];
    }

    const newRecord: MemberFeeAdjustmentInternal = {
      id: `${id}-fa-${String(row._feeAdjustments.length + 1).padStart(3, '0')}`,
      startDate,
      endDate,
      pattern,
      value,
      reason,
      setBy: '管理者',
      // A future period is 適用予定, not 適用中 — the badge in the list depends on it
      status: startDate > formatISODateLocal(new Date()) ? 'scheduled' : 'active',
    };
    row._feeAdjustments.push(newRecord);

    // Keep the head-up 「個別会費調整 適用中」 badge (member-detail bundle) in step with the list
    if (newRecord.status === 'active' && row.currentMainContract) {
      row.currentMainContract.activeFeeAdjustment = {
        feeAdjustmentId: newRecord.id,
        startDate: newRecord.startDate,
        endDate: newRecord.endDate ?? undefined,
        adjustedMonthlyFee: applyFeeAdjustment(row.currentMainContract.plan.monthlyFee, newRecord),
        reason: newRecord.reason ?? undefined,
      };
    }

    const responseData = AddFeeAdjustmentResponseSchema.parse(toFeeAdjustmentItem(newRecord));

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[POST /crm/members/[id]/fee-adjustments]', error);
    return NextResponse.json({ error: 'Failed to add fee adjustment' }, { status: 500 });
  }
}
