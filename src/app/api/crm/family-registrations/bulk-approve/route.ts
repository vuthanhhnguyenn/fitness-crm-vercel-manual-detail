import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  BulkApproveFamilyRegistrationsRequestSchema,
  BulkApproveFamilyRegistrationsResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/bulk-approve',
  summary: 'Bulk approve family registrations',
  tags: ['Family Registrations'],
  requestBody: { schema: BulkApproveFamilyRegistrationsRequestSchema },
  responses: [
    {
      status: 200,
      schema: BulkApproveFamilyRegistrationsResponseSchema,
      description: 'Bulk approved',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
  ],
});

// POST /api/crm/family-registrations/bulk-approve
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = BulkApproveFamilyRegistrationsRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const staff = validation.data.staff_id || 'staff-001';
  const ids = [...new Set(validation.data.ids)];

  const results = ids.map((id) => {
    const existing = db.family.getRegistrationById(id);
    if (!existing) return { id, success: false, error: 'Family registration not found' as const };

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

    return { id, success: true, status: 'completed' as const, member_id: newMember.basic_info.id };
  });

  return NextResponse.json({
    success: results.every((r) => r.success),
    results,
  });
}
