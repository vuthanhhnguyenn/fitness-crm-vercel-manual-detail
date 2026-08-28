import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetSurveyResponsesResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/survey-responses',
  summary: 'Get member survey responses',
  description: 'Get survey response history (アンケート回答) for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetSurveyResponsesResponseSchema,
      description: 'Survey response history',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // The id is shared with the survey-response detail (/surveys/responses/{responseId}),
    // so the tab can navigate straight to the response detail.
    const data = GetSurveyResponsesResponseSchema.parse({
      items: db.surveyReporting.getByMemberId(id).map((row) => ({
        id: row.id,
        surveyName: row.survey_name,
        surveyType: row.template_type,
        responseDate: row.response_date,
      })),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /crm/members/[id]/survey-responses]', error);
    return NextResponse.json({ error: 'Failed to fetch survey responses' }, { status: 500 });
  }
}
