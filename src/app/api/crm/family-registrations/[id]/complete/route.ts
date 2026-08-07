import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CompleteFamilyRegistrationRequestSchema,
  CompleteFamilyRegistrationResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/{id}/complete',
  summary: 'Complete family registration',
  description: 'Finalize family registration and create child member (mocked)',
  tags: ['Family Registrations'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: CompleteFamilyRegistrationRequestSchema },
  responses: [
    { status: 200, schema: CompleteFamilyRegistrationResponseSchema, description: 'Completed' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

// POST /api/crm/family-registrations/{id}/complete
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = CompleteFamilyRegistrationRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const existing = db.family.getRegistrationById(id);
  if (!existing)
    return NextResponse.json({ error: 'Family registration not found' }, { status: 404 });

  // Mock "create child member" by duplicating from application to member DB
  // We reuse membership application creator for a simple member shape; details are not critical for mock.
  const fakeApplication = {
    id: `APP-FAMILY-${id}`,
    applicant_name: existing.applicant_name,
    applied_at: existing.created_at,
    risk_score: existing.risk_score ?? 0,
    risk_reason: 'family_registration',
    plan_name: '家族会員',
    scheduled_start_date: new Date().toISOString().slice(0, 10),
    status: 'manual_approved',
  } as any;

  const member = db.members.createFromApplication(fakeApplication);
  const staff = validation.data.staff_id || 'staff-001';

  db.family.updateRegistrationStatus(id, 'completed', {
    staff_id: staff,
    child_member_id: member.basic_info.id,
  });

  return NextResponse.json({
    success: true,
    id,
    status: 'completed',
    completed_at: new Date().toISOString(),
    member_id: member.basic_info.id,
  });
}
