import { NextRequest, NextResponse } from 'next/server';

import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ExportRefundQueueRequestSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/refund-requests/export',
  summary: 'Export the refund queue as CSV',
  description:
    'Always excludes SBPS-settled refunds and includes only completed entries, regardless of any status/payment_method filter in the request body (F-01 FR-020)',
  tags: ['Billing'],
  requestBody: { schema: ExportRefundQueueRequestSchema },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Forbidden' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

const CSV_HEADERS = [
  'refund_id',
  'requested_at',
  'member_id',
  'member_name',
  'refund_amount',
  'reason',
  'payment_method',
  'approver_name',
];

export async function POST(request: NextRequest) {
  try {
    // SalesRefundExport: System/Headquarter/Manager only (data-model.md permission table, FR-020).
    if (MOCK_ROLE === 'staff' || MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'You do not have permission to export refund data' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = ExportRefundQueueRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { requester_role, date_from, date_to, search } = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const { items } = db.billingRecords.getRefundQueue(
      {
        requester_role,
        date_from,
        date_to,
        search,
        status: 'completed',
        page: 1,
        page_size: 10_000,
      },
      scope,
    );
    const eligible = items.filter((item) => item.payment_method !== 'sbps');

    const rows = eligible.map((item) => [
      item.refund_id,
      item.requested_at,
      item.member_id,
      item.member_name,
      item.refund_amount,
      item.reason,
      item.payment_method,
      item.approver_name,
    ]);

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `refund-export-${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('POST /crm/billing-records/refund-requests/export error:', error);
    return NextResponse.json({ error: 'Failed to export refund data' }, { status: 500 });
  }
}
