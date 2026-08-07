import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BulkRejectFamilyRegistrationsRequestSchema,
  BulkRejectFamilyRegistrationsResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/bulk-reject',
  summary: 'Bulk reject family registrations',
  tags: ['Family Registrations'],
  requestBody: { schema: BulkRejectFamilyRegistrationsRequestSchema },
  responses: [
    {
      status: 200,
      schema: BulkRejectFamilyRegistrationsResponseSchema,
      description: 'Bulk rejected',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
  ],
});

// POST /api/crm/family-registrations/bulk-reject
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = BulkRejectFamilyRegistrationsRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const staff = validation.data.staff_id || 'staff-001';
  const ids = [...new Set(validation.data.ids)];

  const results = ids.map((id) => {
    const existing = db.family.getRegistrationById(id);
    if (!existing) return { id, success: false, error: 'Family registration not found' as const };

    db.family.updateRegistrationStatus(id, 'rejected', {
      staff_id: staff,
      rejection_reason: validation.data.rejection_reason,
    });
    return { id, success: true, status: 'rejected' as const };
  });

  return NextResponse.json({
    success: results.every((r) => r.success),
    results,
  });
}
