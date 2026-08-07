import { NextRequest, NextResponse } from 'next/server';

import {
  SurveyCsvExportRequestSchema,
  SurveyCsvExportResponseSchema,
} from '@/app/api/_schemas/survey-reporting.schema';
import { ErrorResponseSchema as SurveyErrorResponseSchema } from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { buildSurveyResponsesCsv, getFilteredSurveyResponses } from '../../_reporting';

registerRoute({
  method: 'post',
  path: '/crm/surveys/responses/export',
  summary: 'Export survey responses CSV',
  description: 'Export the current survey response view as CSV',
  tags: ['Surveys'],
  requestBody: {
    schema: SurveyCsvExportRequestSchema,
    description: 'Survey response export filters',
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
    const validationResult = SurveyCsvExportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const rows = getFilteredSurveyResponses({
      ...validationResult.data,
      page: validationResult.data.page ?? 1,
      limit: validationResult.data.limit ?? 20,
    });
    const response = buildSurveyResponsesCsv(rows);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('POST /crm/surveys/responses/export error:', error);
    return NextResponse.json({ error: 'Failed to export survey responses' }, { status: 500 });
  }
}
