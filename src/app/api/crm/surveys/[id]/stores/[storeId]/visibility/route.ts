import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  GetSurveyStoreVisibilityResponseSchema,
  type SurveyStoreVisibility,
  UpdateSurveyStoreVisibilityBodySchema,
  UpdateSurveyStoreVisibilityResponseSchema,
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

function buildVisibilityResponse(input: {
  survey: NonNullable<ReturnType<typeof db.surveys.getById>>;
  storeId: string;
  questions?: SurveyStoreVisibility['questions'];
  updatedAt?: string;
}): SurveyStoreVisibility {
  const questionMap = new Map(input.questions?.map((question) => [question.no, question]));

  return {
    survey_id: input.survey.id,
    store_id: input.storeId,
    updated_at: input.updatedAt ?? input.survey.updated_at,
    questions: input.survey.questions.map((question) => {
      const storedQuestion = questionMap.get(question.no);
      const choiceMap = new Map(storedQuestion?.choices.map((choice) => [choice.order, choice]));

      return {
        no: question.no,
        visible: storedQuestion?.visible ?? true,
        choices: question.choices.map((choice) => ({
          order: choice.order,
          visible: choiceMap.get(choice.order)?.visible ?? true,
        })),
      };
    }),
  };
}

function assertStoreAccess(request: NextRequest, storeId: string) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return authResult;
  }

  const allowedStoreIds = getAllowedStoreIds(authResult.user);
  if (allowedStoreIds && !allowedStoreIds.includes(storeId)) {
    return { ok: false as const, status: 403 as const, error: 'Forbidden' };
  }

  return { ok: true as const, user: authResult.user };
}

registerRoute({
  method: 'get',
  path: '/crm/surveys/{id}/stores/{storeId}/visibility',
  summary: 'Get survey store visibility',
  description: 'Get visibility settings for a survey/store pair',
  tags: ['Surveys'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Survey template ID',
      schema: { type: 'string' },
    },
    {
      name: 'storeId',
      in: 'path',
      required: true,
      description: 'Store ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetSurveyStoreVisibilityResponseSchema, description: 'Visibility data' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'put',
  path: '/crm/surveys/{id}/stores/{storeId}/visibility',
  summary: 'Update survey store visibility',
  description: 'Update visibility settings for a survey/store pair',
  tags: ['Surveys'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Survey template ID',
      schema: { type: 'string' },
    },
    {
      name: 'storeId',
      in: 'path',
      required: true,
      description: 'Store ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateSurveyStoreVisibilityBodySchema,
    description: 'Visibility payload',
  },
  responses: [
    { status: 200, schema: UpdateSurveyStoreVisibilityResponseSchema, description: 'Updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storeId: string }> },
) {
  try {
    const { id, storeId } = await params;
    const auth = assertStoreAccess(request, storeId);
    if (!auth.ok) {
      return jsonSurveyError(auth.error, auth.status);
    }

    const survey = db.surveys.getById(id);
    if (!survey) {
      return jsonSurveyError('アンケートが見つかりません', 404);
    }

    const storedVisibility = db.surveyVisibility.getBySurveyAndStore(id, storeId);
    const visibility = buildVisibilityResponse({
      survey,
      storeId,
      questions: storedVisibility?.questions,
      updatedAt: storedVisibility?.updated_at,
    });

    return NextResponse.json({ visibility }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/surveys/[id]/stores/[storeId]/visibility error:', error);
    return jsonSurveyError('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storeId: string }> },
) {
  try {
    const { id, storeId } = await params;
    const auth = assertStoreAccess(request, storeId);
    if (!auth.ok) {
      return jsonSurveyError(auth.error, auth.status);
    }

    const survey = db.surveys.getById(id);
    if (!survey) {
      return jsonSurveyError('アンケートが見つかりません', 404);
    }

    const body = await request.json();
    const parsed = UpdateSurveyStoreVisibilityBodySchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message).join(', ');
      return jsonSurveyError(errors, 400);
    }

    const visibility = db.surveyVisibility.upsert(id, storeId, parsed.data, survey);
    return NextResponse.json(
      { message: 'アンケートの表示設定を更新しました', visibility },
      { status: 200 },
    );
  } catch (error) {
    console.error('PUT /crm/surveys/[id]/stores/[storeId]/visibility error:', error);
    return jsonSurveyError('Internal server error', 500);
  }
}
