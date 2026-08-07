import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateFamilyRegistrationRequestSchema,
  CreateFamilyRegistrationResponseSchema,
  ErrorResponseSchema,
  type GetFamilyRegistrationsQuery,
  GetFamilyRegistrationsQuerySchema,
  GetFamilyRegistrationsResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/family-registrations',
  summary: 'Get family registrations list',
  description: 'Get paginated list of family registrations',
  tags: ['Family Registrations'],
  query: GetFamilyRegistrationsQuerySchema,
  responses: [
    { status: 200, schema: GetFamilyRegistrationsResponseSchema, description: 'List response' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid query' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/family-registrations',
  summary: 'Create family registration',
  description: 'Create a family registration (child enrollment application)',
  tags: ['Family Registrations'],
  requestBody: { schema: CreateFamilyRegistrationRequestSchema },
  responses: [
    { status: 200, schema: CreateFamilyRegistrationResponseSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Primary member not found' },
  ],
});

// GET /api/crm/family-registrations
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryObj: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  const validation = GetFamilyRegistrationsQuerySchema.safeParse(queryObj);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const query: GetFamilyRegistrationsQuery = validation.data;
  const { page, limit, status, search, sort_by, sort_order } = query;

  let rows = db.family.listRegistrations();

  if (status) rows = rows.filter((r) => r.status === status);
  if (search) {
    const s = search.toLowerCase().trim();
    rows = rows.filter(
      (r) =>
        r.id.toLowerCase().includes(s) ||
        r.primary_member_id.toLowerCase().includes(s) ||
        r.applicant_name.toLowerCase().includes(s),
    );
  }

  rows.sort((a, b) => {
    const dir = sort_order === 'asc' ? 1 : -1;
    if (sort_by === 'risk_score') {
      return dir * ((a.risk_score ?? -1) - (b.risk_score ?? -1));
    }
    return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  const total = rows.length;
  const total_pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = rows.slice(start, start + limit);

  // enrich list row with primary name/store/fee from member and brand settings
  const registrations = paginated.map((r) => {
    const primary = db.members.get(r.primary_member_id);
    const { settings } = db.family.getBrandSettingsByPrimaryMemberId(r.primary_member_id);
    return {
      id: r.id,
      created_at: r.created_at,
      status: r.status,
      primary_member_id: r.primary_member_id,
      primary_member_name: primary?.basic_info.name_kanji ?? '—',
      applicant_name: r.applicant_name,
      relationship: r.relationship,
      invite_expires_at: r.invite_expires_at,
      store_id: primary?.profile.store_id ?? '—',
      store_name: primary?.profile.store_name ?? '—',
      monthly_fee: settings.family_member_fee,
      risk_score: r.risk_score,
      risk_reason: r.risk_reason,
      ekyc: r.ekyc,
    };
  });

  return NextResponse.json({
    registrations,
    pagination: { total, total_pages, current_page: page, limit },
  });
}

// POST /api/crm/family-registrations
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = CreateFamilyRegistrationRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const primary = db.members.get(validation.data.primary_member_id);
  if (!primary) {
    return NextResponse.json({ error: 'Primary member not found' }, { status: 404 });
  }

  const created = db.family.createRegistration(validation.data);
  const { settings } = db.family.getBrandSettingsByPrimaryMemberId(created.primary_member_id);

  return NextResponse.json({
    success: true,
    registration: {
      id: created.id,
      created_at: created.created_at,
      status: created.status,
      primary_member_id: created.primary_member_id,
      primary_member_name: primary.basic_info.name_kanji,
      applicant_name: created.applicant_name,
      relationship: created.relationship,
      invite_expires_at: created.invite_expires_at,
      store_id: primary.profile.store_id,
      store_name: primary.profile.store_name,
      monthly_fee: settings.family_member_fee,
      risk_score: created.risk_score,
      risk_reason: created.risk_reason,
      ekyc: created.ekyc,
    },
  });
}
