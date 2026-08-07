import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RejectFamilyRegistrationRequestSchema,
  RejectFamilyRegistrationResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/{id}/reject',
  summary: 'Reject family registration',
  tags: ['Family Registrations'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: RejectFamilyRegistrationRequestSchema },
  responses: [
    { status: 200, schema: RejectFamilyRegistrationResponseSchema, description: 'Rejected' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

// POST /api/crm/family-registrations/{id}/reject
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await request.json();
  const validation = RejectFamilyRegistrationRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const existing = db.family.getRegistrationById(id);
  if (!existing)
    return NextResponse.json({ error: 'Family registration not found' }, { status: 404 });

  const staff = validation.data.staff_id || 'staff-001';
  db.family.updateRegistrationStatus(id, 'rejected', {
    staff_id: staff,
    rejection_reason: validation.data.rejection_reason,
  });

  return NextResponse.json({
    success: true,
    id,
    status: 'rejected',
    rejected_at: new Date().toISOString(),
    rejected_by: staff,
    rejection_reason: validation.data.rejection_reason,
  });
}
