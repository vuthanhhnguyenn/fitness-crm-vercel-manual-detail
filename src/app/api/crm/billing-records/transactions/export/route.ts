import { NextRequest, NextResponse } from 'next/server';

import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import { ExportTransactionLedgerRequestSchema } from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/transactions/export',
  summary: 'Export the transaction ledger as CSV',
  description: 'CSV export reflecting the currently-applied filters, unpaginated (F-01 FR-003)',
  tags: ['Billing'],
  requestBody: { schema: ExportTransactionLedgerRequestSchema },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, description: 'Validation failure' },
    { status: 403, description: 'Sales data is not available for this role' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

const CSV_HEADERS = [
  'transaction_date',
  'member_id',
  'member_name',
  'store_name',
  'transaction_type',
  'billing_line_item_id',
  'amount_ex_tax',
  'tax_rate',
  'amount_inc_tax',
  'payment_method',
  'status',
];

export async function POST(request: NextRequest) {
  try {
    if (MOCK_ROLE === 'trainer' || MOCK_ROLE === 'observer') {
      return NextResponse.json(
        { error: 'Sales data is not available for this role' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = ExportTransactionLedgerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const { items } = db.billingRecords.getTransactionLedger(
      { ...validationResult.data, page: 1, page_size: 10_000 },
      scope,
    );

    const rows = items.map((item) => [
      item.transaction_date,
      item.member_id,
      item.member_name,
      item.store_name,
      item.transaction_type,
      item.billing_line_item_id,
      item.amount_ex_tax,
      item.tax_rate,
      item.amount_inc_tax,
      item.payment_method,
      item.status,
    ]);

    const csv = buildCsv(CSV_HEADERS, rows);
    return csvFileResponse(csv, `transactions-export-${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('POST /crm/billing-records/transactions/export error:', error);
    return NextResponse.json({ error: 'Failed to export transaction ledger' }, { status: 500 });
  }
}
