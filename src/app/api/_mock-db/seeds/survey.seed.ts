import type {
  SurveyTemplateChangeHistoryItem,
  SurveyTemplateDetail,
  SurveyTemplateListItem,
} from '@/app/api/_schemas/survey.schema';

export function toSurveyTemplateListItem(survey: SurveyTemplateDetail): SurveyTemplateListItem {
  return {
    id: survey.id,
    name: survey.name,
    type: survey.type,
    trigger: survey.trigger,
    brand: survey.brand,
    question_count: survey.question_count,
    response_count: survey.response_count,
    response_rate: survey.response_rate,
    last_response_date: survey.last_response_date,
    status: survey.status,
  };
}

export function buildSurveyTemplateDetail(
  survey: SurveyTemplateListItem,
  overrides: Partial<Omit<SurveyTemplateDetail, keyof SurveyTemplateListItem>> = {},
): SurveyTemplateDetail {
  const questions =
    overrides.questions?.map((question) => ({
      ...question,
      choices: question.choices.map((choice) => ({ ...choice })),
    })) ?? [];
  const questionCount = overrides.questions?.length ?? survey.question_count;

  return {
    ...survey,
    question_count: questionCount,
    created_at: overrides.created_at ?? '2024/04/01',
    updated_at: overrides.updated_at ?? '2026/03/10',
    questions,
  };
}

export function buildSurveyTemplateChangeHistory(
  survey: SurveyTemplateDetail,
): SurveyTemplateChangeHistoryItem[] {
  const currentStatus = survey.status === 'active' ? '有効' : '無効';
  const previousStatus = survey.status === 'active' ? '無効' : '有効';

  return [
    {
      date: `${survey.updated_at} 10:00`,
      user: '管理者A',
      field: 'ステータス',
      from: previousStatus,
      to: currentStatus,
    },
    {
      date: `${survey.created_at} 09:00`,
      user: '管理者A',
      field: null,
      from: null,
      to: '新規作成',
    },
  ];
}
