import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetContractSummaryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { formatISODateLocal } from '@/utils/date.util';
import { addMonths, getDaysInMonth, setDate } from 'date-fns';

/**
 * Next occurrence of `billingDay`: this month while the day is still ahead, otherwise next month.
 * Days past the end of the target month are clamped to its last day (e.g. 31 → 2月28日).
 */
function resolveNextBillingDate(billingDay: number | null): string | null {
  if (billingDay == null) return null;
  const today = new Date();
  const target = billingDay >= today.getDate() ? today : addMonths(today, 1);
  const clampedDay = Math.min(billingDay, getDaysInMonth(target));
  return formatISODateLocal(setDate(target, clampedDay));
}

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/contracts/summary',
  summary: 'Get member contract summary',
  description:
    'Get a compact contract summary for a member (plan name, monthly fee, billing info, unpaid amount)',
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
      schema: GetContractSummaryResponseSchema,
      description: 'Contract summary',
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const contracts = db.contracts.getByMemberId(id);

    const mainMonthlyFee = contracts?.main_contract?.monthly_fee ?? 0;
    const optionsMonthlyFee =
      contracts?.option_contracts?.reduce((sum, opt) => sum + opt.monthly_fee, 0) ?? 0;

    const billingDay = contracts?.payment_info?.billing_day ?? null;

    const summary = {
      planName: contracts?.main_contract?.plan_name ?? null,
      totalMonthlyFee: mainMonthlyFee + optionsMonthlyFee,
      billingDay,
      nextBillingDate: resolveNextBillingDate(billingDay),
      paymentMethod: contracts?.payment_info?.method ?? null,
      // The seeded contract rows are shared per plan and carry no per-member unpaid data
      // (`unpaid_info` is always null), so fall back to the member's own balance — the same
      // source the member detail and transfer screens read — instead of reporting every
      // member as debt-free.
      unpaidAmount: contracts?.unpaid_info?.amount ?? member.unpaidAmount,
    };

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract summary' }, { status: 500 });
  }
}
