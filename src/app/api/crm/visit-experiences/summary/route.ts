import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetVisitExperiencesSummaryResponse,
  GetVisitExperiencesSummaryResponseSchema,
} from '@/app/api/_schemas/visit-experience.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/visit-experiences/summary',
  summary: 'Get visit experiences KPI summary',
  description: 'Get same-day KPI counts for visit/experience reservations',
  tags: ['Visit Experiences'],
  responses: [
    {
      status: 200,
      schema: GetVisitExperiencesSummaryResponseSchema,
      description: 'KPI summary counts',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const allowedStoreIds = getAllowedStoreIds(authResult.user);
    if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const all =
      allowedStoreIds === null
        ? db.visitExperiences.getAll()
        : db.visitExperiences.getAll().filter((ve) => allowedStoreIds.includes(ve.store_id));

    const todayStr = new Date().toISOString().split('T')[0];

    const isToday = (isoDate: string) => isoDate.split('T')[0] === todayStr;

    const today_applications = all.filter((ve) => isToday(ve.reserved_at)).length;
    const visiting_count = all.filter((ve) => ve.status === 'visiting').length;
    const today_membership_count = all.filter(
      (ve) => ve.status === 'membership_applied' && isToday(ve.reserved_at),
    ).length;
    const today_cancelled_count = all.filter(
      (ve) => ve.status === 'cancelled' && isToday(ve.reserved_at),
    ).length;

    const response: GetVisitExperiencesSummaryResponse = {
      today_applications,
      visiting_count,
      today_membership_count,
      today_cancelled_count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching visit experiences summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
