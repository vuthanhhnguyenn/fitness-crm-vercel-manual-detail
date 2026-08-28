import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BulkPlanChangeConflictSchema,
  type BulkPlanChangeRequest,
  BulkPlanChangeRequestSchema,
  type BulkPlanChangeResponse,
  BulkPlanChangeResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/members/bulk-plan-changes',
  summary: 'Book a bulk main-contract change (A-01 FR-020)',
  description:
    'Books a main-contract change for multiple members. Nothing changes until the worker ' +
    'runs on `effective_date` (always the 1st of a month), so the job is created `pending` ' +
    'and there is nothing to poll for.',
  tags: ['Members'],
  requestBody: {
    schema: BulkPlanChangeRequestSchema,
    description: 'Target member ids and the new main contract id',
  },
  responses: [
    {
      status: 200,
      schema: BulkPlanChangeResponseSchema,
      description: 'Bulk change booked',
    },
    {
      status: 409,
      schema: BulkPlanChangeConflictSchema,
      description: 'Some selected members already have a plan change booked (E-BPC-205)',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Target main contract not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

/** The earliest date a booking may target: the 1st of next month. */
function nextMonthStartISO(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/** 12 months past next month — the far end of the accepted window. */
function maxEffectiveISO(): string {
  const now = new Date();
  const max = new Date(now.getFullYear(), now.getMonth() + 13, 1);
  return `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = BulkPlanChangeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { member_ids, contract_id, effective_date, reason }: BulkPlanChangeRequest =
      validationResult.data;

    const targetMainContract = db.mainContracts
      .getList()
      .find((contract) => contract.id === contract_id);
    if (!targetMainContract) {
      return NextResponse.json({ error: 'Main contract not found' }, { status: 404 });
    }

    // The apply date is the client's to choose, but only the 1st of a month within
    // the next 12 months is accepted.
    if (
      !effective_date.endsWith('-01') ||
      effective_date < nextMonthStartISO() ||
      effective_date > maxEffectiveISO()
    ) {
      return NextResponse.json(
        { error: 'effective_date must be the 1st of a month, from next month up to 12 months out' },
        { status: 400 },
      );
    }

    // E-BPC-205: a member who already has a booked change cannot take another one.
    // The whole request is rejected so the operator can deselect them, rather than
    // silently skipping part of the selection.
    const conflicting = member_ids.filter(
      (memberId) => !!db.contracts.getByMemberId(memberId)?.main_contract.pending_plan_change,
    );
    if (conflicting.length > 0) {
      return NextResponse.json(
        {
          error: 'Some members already have a pending plan change',
          code: 'E-BPC-205',
          details: { conflicting_member_ids: conflicting.slice(0, 100) },
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const jobId = `bpc-${effective_date.replace(/-/g, '')}-${member_ids.length}`;
    let scheduledCount = 0;

    for (const memberId of member_ids) {
      const member = db.members.get(memberId);
      const current = db.contracts.getByMemberId(memberId);
      if (!member || !current) continue;

      // Booked, not applied: the current plan stays untouched until the apply date.
      // Only the pending record is written, which is what the member detail shows.
      db.contracts.create({
        contract_id: member.currentMainContract?.contractId || `CONTRACT-${memberId}`,
        member_id: memberId,
        data: {
          ...current,
          main_contract: {
            ...current.main_contract,
            pending_plan_change: {
              source: 'bulk_job',
              source_id: jobId,
              application_id: jobId,
              to_plan_id: targetMainContract.id,
              to_plan_name: targetMainContract.name,
              to_monthly_fee: targetMainContract.price_including_tax,
              effective_from: effective_date,
              requested_at: now,
              requested_by: reason ? `本部（${reason}）` : '本部',
            },
          },
        },
      });
      scheduledCount += 1;
    }

    const response: BulkPlanChangeResponse = {
      job_id: jobId,
      status: 'pending',
      scheduled_count: scheduledCount,
      effective_date,
      contract_id: targetMainContract.id,
      contract_name: targetMainContract.name,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Failed to book bulk plan change' }, { status: 500 });
  }
}
