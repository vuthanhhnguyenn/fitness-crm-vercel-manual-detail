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
  path: '/crm/billing-records/{id}/line-items/{lineItemId}/receipt',
  summary: 'Download a receipt PDF for one line item',
  description:
    'Blocked until the line item payment_status is confirmed (F-01 FR-013). Phase 1: static placeholder PDF body (research.md §5)',
  tags: ['Billing'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Billing record ID',
    },
    {
      name: 'lineItemId',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Line item ID',
    },
  ],
  responses: [
    { status: 200, description: 'PDF file' },
    { status: 403, description: 'Forbidden' },
    { status: 404, description: 'Billing record or line item not found' },
    { status: 409, description: 'Payment not confirmed' },
  ],
});

// Phase 1 mock: role scoping wired to a hardcoded caller (real auth context in Phase 2).
const MOCK_ROLE: StaffRole = 'headquarter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> },
) {
  try {
    if (!canPerformSalesAction(MOCK_ROLE, 'download-file')) {
      return NextResponse.json(
        { error: 'You do not have permission to download receipts' },
        { status: 403 },
      );
    }

    const { id, lineItemId } = await params;
    const scope = resolveSalesDataScope(MOCK_ROLE, {});
    const detail = db.billingRecords.getById(id, scope);
    if (!detail) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }
    const lineItem = detail.line_items.find((li) => li.id === lineItemId);
    if (!lineItem) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
    }
    if (lineItem.payment_status !== 'confirmed') {
      return NextResponse.json({ error: 'payment not confirmed' }, { status: 409 });
    }

    const filePath = path.join(
      process.cwd(),
      'src/app/api/_mock-db/assets/placeholder-receipt.pdf',
    );
    const buffer = await readFile(filePath);
    return pdfFileResponse(buffer, `receipt-${lineItemId}.pdf`);
  } catch (error) {
    console.error('GET /crm/billing-records/[id]/line-items/[lineItemId]/receipt error:', error);
    return NextResponse.json({ error: 'Failed to download receipt' }, { status: 500 });
  }
}
