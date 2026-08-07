import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetSurveyTemplatesQuery,
  GetSurveyTemplatesQuerySchema,
  type GetSurveyTemplatesResponse,
  GetSurveyTemplatesResponseSchema,
  type SurveyTemplateListItem,
  SurveyTemplateUpsertBodySchema,
  SurveyTemplateUpsertResponseSchema,
} from '@/app/api/_schemas/survey.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

function jsonSurveyError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
      detail: { message },
    },
    { status },
  );
}

registerRoute({
  method: 'post',
  path: '/crm/surveys',
  summary: 'Create survey template',
  description: 'Create a lifecycle survey template',
  tags: ['Surveys'],
  requestBody: {
    schema: SurveyTemplateUpsertBodySchema,
    description: 'Lifecycle survey template upsert payload',
  },
  responses: [
    { status: 201, schema: SurveyTemplateUpsertResponseSchema, description: 'Created survey' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 409, schema: ErrorResponseSchema, description: 'Duplicate trigger conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'get',
  path: '/crm/surveys',
  summary: 'Get survey templates',
  description: 'Get paginated list of survey templates (G-04 FR-001 slice)',
  tags: ['Surveys'],
  query: GetSurveyTemplatesQuerySchema,
  responses: [
    { status: 200, schema: GetSurveyTemplatesResponseSchema, description: 'Survey template list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function findDuplicateActiveTrigger(trigger: string) {
  return db.surveys
    .getList()
    .find((survey) => survey.trigger === trigger && survey.status === 'active');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};

    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetSurveyTemplatesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return jsonSurveyError(errors, 400);
    }

    const query: GetSurveyTemplatesQuery = validationResult.data;
    const { page, limit, search, type, brand, status, sort_by, sort_order } = query;

    let filtered: SurveyTemplateListItem[] = [...db.surveys.getList()];

    if (search) {
      const keyword = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword),
      );
    }

    if (type) {
      filtered = filtered.filter((item) => item.type === type);
    }

    if (brand) {
      filtered = filtered.filter((item) => item.brand === brand);
    }

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    filtered.sort((a, b) => {
      const aVal = a[sort_by] ?? '';
      const bVal = b[sort_by] ?? '';
      const comparison =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'ja');
      return sort_order === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;
    const surveys = filtered.slice(start, start + limit);

    const response: GetSurveyTemplatesResponse = {
      surveys,
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /crm/surveys error:', error);
    return jsonSurveyError('Failed to fetch surveys', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = SurveyTemplateUpsertBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return jsonSurveyError(errors, 400);
    }

    const duplicate = findDuplicateActiveTrigger(validationResult.data.trigger);
    if (duplicate) {
      if (validationResult.data.replace_existing_survey_id === duplicate.id) {
        db.surveys.updateStatus(duplicate.id, 'inactive', '新規登録により無効化');
      } else {
        return jsonSurveyError('同一トリガーのアンケートが既に存在します', 409);
      }
    }

    const survey = db.surveys.add(validationResult.data);
    return NextResponse.json({ message: 'アンケートを登録しました', survey }, { status: 201 });
  } catch (error) {
    console.error('POST /crm/surveys error:', error);
    return jsonSurveyError('Failed to create survey', 500);
  }
}
