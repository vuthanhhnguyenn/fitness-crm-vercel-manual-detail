import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetFamilyMembersResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{member_id}/family-members',
  summary: 'Get primary member family members',
  description: 'Get family members linked to a primary member',
  tags: ['Family Members'],
  parameters: [
    {
      name: 'member_id',
      in: 'path',
      required: true,
      description: 'Primary member id',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetFamilyMembersResponseSchema, description: 'Family members list' },
    { status: 404, schema: ErrorResponseSchema, description: 'Primary member not found' },
  ],
});

// GET /api/crm/members/{member_id}/family-members
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const primary = db.members.get(id);
  if (!primary) {
    return NextResponse.json({ error: 'Primary member not found' }, { status: 404 });
  }

  const { settings, members } = db.family.getFamilyMembers(id);
  return NextResponse.json({ members, limit: settings.family_member_limit });
}
