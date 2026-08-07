import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
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
  ],
});

export async function GET() {
  try {
    const all = db.visitExperiences.getAll();

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
