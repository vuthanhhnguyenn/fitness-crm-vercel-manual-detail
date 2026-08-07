import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ApproveFamilyRegistrationRequestSchema,
  ApproveFamilyRegistrationResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/{id}/approve',
  summary: 'Approve family registration',
  tags: ['Family Registrations'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ApproveFamilyRegistrationRequestSchema },
  responses: [
    { status: 200, schema: ApproveFamilyRegistrationResponseSchema, description: 'Approved' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

// POST /api/crm/family-registrations/{id}/approve
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // optional body
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = ApproveFamilyRegistrationRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const existing = db.family.getRegistrationById(id);
  if (!existing)
    return NextResponse.json({ error: 'Family registration not found' }, { status: 404 });

  const staff = validation.data.staff_id || 'staff-001';

  // Create a new member record with member_type = 'family'
  const newMember = db.members.createFromFamilyRegistration({
    applicant_name: existing.applicant_name,
    relationship: existing.relationship,
    applicant: existing.applicant,
    primary_member_id: existing.primary_member_id,
  });

  // Copy contract information from the primary member
  const primaryContract = db.contracts.getByMemberId(existing.primary_member_id);
  if (primaryContract) {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    db.contracts.create({
      contract_id: `CONTRACT-${newMember.basic_info.id}`,
      member_id: newMember.basic_info.id,
      data: {
        ...primaryContract,
        main_contract: {
          ...primaryContract.main_contract,
          start_date: today,
          change_history: [
            {
              changed_at: now,
              previous_plan: '—',
              new_plan: primaryContract.main_contract.plan_name,
              reason: '家族会員入会',
            },
          ],
        },
        option_contracts: [],
        option_change_history: [],
      },
    });
  }

  // Link the new member as a family child of the primary member
  db.family.linkChildRelationship(
    existing.primary_member_id,
    newMember.basic_info.id,
    existing.relationship,
  );

  // Update registration status and store the generated child_member_id
  db.family.updateRegistrationStatus(id, 'completed', {
    staff_id: staff,
    child_member_id: newMember.basic_info.id,
  });

  return NextResponse.json({
    success: true,
    id,
    status: 'completed',
    approved_at: new Date().toISOString(),
    approved_by: staff,
    member_id: newMember.basic_info.id,
  });
}
