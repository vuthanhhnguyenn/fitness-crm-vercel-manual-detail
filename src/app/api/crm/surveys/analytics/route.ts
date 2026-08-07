import { NextRequest, NextResponse } from 'next/server';

import {
  GetSurveyAnalyticsQuerySchema,
  GetSurveyAnalyticsResponseSchema,
} from '@/app/api/_schemas/survey-reporting.schema';
import { ErrorResponseSchema as SurveyErrorResponseSchema } from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { buildSurveyAnalyticsResponse } from '../_reporting';

registerRoute({
  method: 'get',
  path: '/crm/surveys/analytics',
  summary: 'Get survey analytics',
  description: 'Get aggregated survey analytics for the selected survey context',
  tags: ['Surveys'],
  query: GetSurveyAnalyticsQuerySchema,
  responses: [
    { status: 200, schema: GetSurveyAnalyticsResponseSchema, description: 'Survey analytics' },
    { status: 400, schema: SurveyErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: SurveyErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validationResult = GetSurveyAnalyticsQuerySchema.safeParse(queryObj);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const response = buildSurveyAnalyticsResponse(validationResult.data);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET /crm/surveys/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch survey analytics' }, { status: 500 });
  }
}
