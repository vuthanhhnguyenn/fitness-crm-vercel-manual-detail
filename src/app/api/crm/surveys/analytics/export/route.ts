import { NextRequest, NextResponse } from 'next/server';

import {
  SurveyAnalyticsCsvExportRequestSchema,
  SurveyCsvExportResponseSchema,
} from '@/app/api/_schemas/survey-reporting.schema';
import { ErrorResponseSchema as SurveyErrorResponseSchema } from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { buildSurveyAnalyticsCsv, buildSurveyAnalyticsResponse } from '../../_reporting';

registerRoute({
  method: 'post',
  path: '/crm/surveys/analytics/export',
  summary: 'Export survey analytics CSV',
  description: 'Export the current survey analytics view as CSV',
  tags: ['Surveys'],
  requestBody: {
    schema: SurveyAnalyticsCsvExportRequestSchema,
    description: 'Survey analytics export filters',
  },
  responses: [
    { status: 200, schema: SurveyCsvExportResponseSchema, description: 'CSV export payload' },
    { status: 400, schema: SurveyErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: SurveyErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = SurveyAnalyticsCsvExportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const analytics = buildSurveyAnalyticsResponse(validationResult.data);
    const response = buildSurveyAnalyticsCsv(analytics);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('POST /crm/surveys/analytics/export error:', error);
    return NextResponse.json({ error: 'Failed to export survey analytics' }, { status: 500 });
  }
}
