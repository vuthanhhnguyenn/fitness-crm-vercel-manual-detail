import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetContractSummaryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

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

    const summary = {
      plan_name: contracts?.main_contract?.plan_name ?? null,
      total_monthly_fee: mainMonthlyFee + optionsMonthlyFee,
      billing_day: contracts?.payment_info?.billing_day ?? null,
      payment_method: contracts?.payment_info?.method ?? null,
      unpaid_amount: contracts?.unpaid_info?.amount ?? 0,
    };

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract summary' }, { status: 500 });
  }
}
