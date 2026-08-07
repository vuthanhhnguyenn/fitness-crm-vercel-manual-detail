import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { GetSurveyResponseDetailResponseSchema } from '@/app/api/_schemas/survey-reporting.schema';
import { ErrorResponseSchema as SurveyErrorResponseSchema } from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/surveys/responses/{responseId}',
  summary: 'Get survey response detail',
  description: 'Get one survey response with member and answer detail',
  tags: ['Surveys'],
  parameters: [
    {
      name: 'responseId',
      in: 'path',
      required: true,
      description: 'Survey response ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetSurveyResponseDetailResponseSchema,
      description: 'Survey response detail',
    },
    { status: 404, schema: SurveyErrorResponseSchema, description: 'Survey response not found' },
    { status: 500, schema: SurveyErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> },
) {
  try {
    const { responseId } = await params;
    const response = db.surveyReporting.getById(responseId);

    if (!response) {
      return NextResponse.json({ error: 'Survey response not found' }, { status: 404 });
    }

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/surveys/responses/[responseId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch survey response' }, { status: 500 });
  }
}
