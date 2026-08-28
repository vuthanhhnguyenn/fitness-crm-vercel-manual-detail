import { NextRequest, NextResponse } from 'next/server';

import { pdfFileResponse } from '@/app/api/_lib/pdf';
import { db } from '@/app/api/_mock-db';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { StaffRole } from '@/lib/api/types.gen';
import { canPerformSalesAction, resolveSalesDataScope } from '@/lib/utils/sales-permissions';

registerRoute({
  method: 'get',
  path: '/crm/billing-records/{id}/invoice',
  summary: 'Download an invoice PDF for a billing record',
  description:
    'No payment-status gate (upcoming or confirmed billing). Phase 1: static placeholder PDF body (research.md §5)',
  tags: ['Billing'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Billing record ID',
    },
  ],
  responses: [
    { status: 200, description: 'PDF file' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record not found' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'download-file')) {
      return NextResponse.json(
        { error: 'You do not have permission to download invoices' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const detail = db.billingRecords.getById(id, scope);
    if (!detail) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }

    const filePath = path.join(
      process.cwd(),
      'src/app/api/_mock-db/assets/placeholder-receipt.pdf',
    );
    const buffer = await readFile(filePath);
    return pdfFileResponse(buffer, `invoice-${id}.pdf`);
  } catch (error) {
    console.error('GET /crm/billing-records/[id]/invoice error:', error);
    return NextResponse.json({ error: 'Failed to download invoice' }, { status: 500 });
  }
}
