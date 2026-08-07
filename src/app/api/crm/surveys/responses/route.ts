import { NextRequest, NextResponse } from 'next/server';

import {
  GetSurveyResponsesQuerySchema,
  GetSurveyResponsesResponseSchema,
} from '@/app/api/_schemas/survey-reporting.schema';
import { ErrorResponseSchema as SurveyErrorResponseSchema } from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { getFilteredSurveyResponsesList } from '../_reporting';

registerRoute({
  method: 'get',
  path: '/crm/surveys/responses',
  summary: 'Get survey responses',
  description: 'Get paginated survey response list',
  tags: ['Surveys'],
  query: GetSurveyResponsesQuerySchema,
  responses: [
    { status: 200, schema: GetSurveyResponsesResponseSchema, description: 'Survey response list' },
    { status: 400, schema: SurveyErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: SurveyErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validationResult = GetSurveyResponsesQuerySchema.safeParse(queryObj);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const response = getFilteredSurveyResponsesList(validationResult.data);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET /crm/surveys/responses error:', error);
    return NextResponse.json({ error: 'Failed to fetch survey responses' }, { status: 500 });
  }
}
