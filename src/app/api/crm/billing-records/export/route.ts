import { NextRequest, NextResponse } from 'next/server';

import { buildCsv, csvDateStamp, csvFileResponse } from '@/app/api/_lib/csv';
import { db } from '@/app/api/_mock-db';
import {
  type AccountingEntryType,
  ExportBillingRecordsRequestSchema,
} from '@/app/api/_schemas/billing.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'post',
  path: '/crm/billing-records/export',
  summary: 'Export billing records as an accounting CSV',
  description:
    'Accounting-linked CSV export for a selected month, per entry type or combined (F-01 FR-007)',
  tags: ['Billing'],
  requestBody: { schema: ExportBillingRecordsRequestSchema },
  responses: [
    { status: 200, description: 'CSV file (UTF-8 with BOM)' },
    { status: 400, description: 'Validation failure' },
    {
      status: 403,
      description: 'Accounting export is restricted to Headquarters, Manager, and System roles',
    },
  ],
});

// Phase 1 mock: caller identity is a hardcoded constant (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

const CSV_HEADERS_WITH_TYPE = [
  'entry_type',
  'billing_record_id',
  'store_name',
  'member_name',
  'billing_month',
  'amount',
  'date',
  'notes',
];
const CSV_HEADERS_SINGLE = CSV_HEADERS_WITH_TYPE.filter((h) => h !== 'entry_type');

export async function POST(request: NextRequest) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'export')) {
      return NextResponse.json(
        { error: 'Accounting export is restricted to Headquarters, Manager, and System roles' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = ExportBillingRecordsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { billing_month, store_id, entry_type } = validationResult.data;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const { items: records } = db.billingRecords.getList(
      { billing_month, store_id, confirmation_status: 'confirmed', page: 1, limit: 10_000 },
      scope,
    );

    type Row = {
      entryType: AccountingEntryType;
      billingRecordId: string;
      storeName: string;
      memberName: string;
      billingMonth: string;
      amount: number;
      date: string;
      notes: string;
    };
    const rows: Row[] = [];

    const wants = (type: AccountingEntryType) => entry_type === 'all' || entry_type === type;

    for (const record of records) {
      if (wants('sales')) {
        rows.push({
          entryType: 'sales',
          billingRecordId: record.id,
          storeName: record.store_name,
          memberName: record.member_name,
          billingMonth: record.billing_month,
          amount: record.billed_amount,
          date: record.billing_date,
          notes: '',
        });
      }
      if (wants('payment') && record.paid_amount > 0) {
        rows.push({
          entryType: 'payment',
          billingRecordId: record.id,
          storeName: record.store_name,
          memberName: record.member_name,
          billingMonth: record.billing_month,
          amount: record.paid_amount,
          date: record.billing_date,
          notes: '',
        });
      }
      if (wants('bad_debt') && record.is_bad_debt) {
        rows.push({
          entryType: 'bad_debt',
          billingRecordId: record.id,
          storeName: record.store_name,
          memberName: record.member_name,
          billingMonth: record.billing_month,
          amount: record.outstanding_amount,
          date: record.billing_date,
          notes: '',
        });
      }
    }

    if (wants('refund')) {
      for (const record of records) {
        const detail = db.billingRecords.getById(record.id, scope);
        for (const refund of detail?.refund_requests ?? []) {
          if (refund.status !== 'completed') continue;
          rows.push({
            entryType: 'refund',
            billingRecordId: record.id,
            storeName: record.store_name,
            memberName: record.member_name,
            billingMonth: record.billing_month,
            amount: -refund.amount,
            date: record.billing_date,
            notes: refund.reason,
          });
        }
      }
    }
    // 'expense' entry type has no corresponding Sales Management entity in Phase 1 — always empty.

    const includeTypeColumn = entry_type === 'all';
    const headers = includeTypeColumn ? CSV_HEADERS_WITH_TYPE : CSV_HEADERS_SINGLE;
    const csvRows = rows.map((r) =>
      includeTypeColumn
        ? [
            r.entryType,
            r.billingRecordId,
            r.storeName,
            r.memberName,
            r.billingMonth,
            r.amount,
            r.date,
            r.notes,
          ]
        : [r.billingRecordId, r.storeName, r.memberName, r.billingMonth, r.amount, r.date, r.notes],
    );

    const csv = buildCsv(headers, csvRows);
    return csvFileResponse(csv, `billing-export-${entry_type}-${csvDateStamp()}.csv`);
  } catch (error) {
    console.error('POST /crm/billing-records/export error:', error);
    return NextResponse.json({ error: 'Failed to export billing records' }, { status: 500 });
  }
}
