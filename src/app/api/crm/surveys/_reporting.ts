import { db } from '@/app/api/_mock-db';
import type {
  GetSurveyAnalyticsQuery,
  GetSurveyAnalyticsResponse,
  GetSurveyResponsesQuery,
  GetSurveyResponsesResponse,
  SurveyAnalyticsChoiceStat,
  SurveyAnalyticsContext,
  SurveyAnalyticsFreeTextSample,
  SurveyAnalyticsQuestion,
  SurveyCsvExportResponse,
  SurveyResponseDetail,
  SurveyResponseListItem,
} from '@/app/api/_schemas/survey-reporting.schema';
import type { SurveyQuestion, SurveyTemplateDetail } from '@/app/api/_schemas/survey.schema';

type SurveyResponseQuery = GetSurveyResponsesQuery | GetSurveyAnalyticsQuery;

const SURVEY_TYPE_LABELS = {
  lifecycle: 'ライフサイクル',
  operational: 'オペレーション',
} as const;

const SURVEY_QUESTION_FORMAT_LABELS = {
  single_choice: '選択式（単一）',
  multiple_choice: '選択式（複数）',
  free_text: '自由記述',
} as const;

const SURVEY_RESPONSE_STATUS_LABELS = {
  completed: '完了',
  partial: '未完了',
} as const;

const SURVEY_RESPONSE_MEMBER_TYPE_LABELS = {
  regular: '通常会員',
  family: '家族会員',
  corporate: '法人会員',
  one_day_member: 'ビジター',
} as const;

const SURVEY_BRAND_LABELS = {
  joyfit: 'JOYFIT',
  fit365: 'FIT365',
  joyfit24: 'JOYFIT24',
  joyfit_yoga: 'JOYFIT YOGA',
  joyfit_plus: 'JOYFIT+',
} as const;

function normalizeDateString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatSurveyDateOnly(value?: string | null): string {
  if (!value) return '—';
  return value.trim().split(' ')[0] ?? '—';
}

function compareDateStrings(value: string, from?: string, to?: string): boolean {
  const date = value.slice(0, 10);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function matchesSearch(row: SurveyResponseDetail, search?: string): boolean {
  if (!search) return true;
  const keyword = search.toLowerCase().trim();
  if (!keyword) return true;
  return row.survey_name.toLowerCase().includes(keyword);
}

function matchesFilters(row: SurveyResponseDetail, query: SurveyResponseQuery): boolean {
  const periodFrom = normalizeDateString(query.period_from);
  const periodTo = normalizeDateString(query.period_to);

  if (query.survey_id && row.survey_id !== query.survey_id) return false;
  if (!matchesSearch(row, query.search)) return false;
  if (query.brand && row.brand !== query.brand) return false;
  if (query.store_id && row.store_id !== query.store_id) return false;
  if (query.template_type && row.template_type !== query.template_type) return false;
  if (query.member_type && row.member_type !== query.member_type) return false;
  if (!compareDateStrings(row.response_date, periodFrom, periodTo)) return false;

  return true;
}

export function getFilteredSurveyResponses(query: GetSurveyResponsesQuery): SurveyResponseDetail[] {
  return db.surveyReporting.getAll().filter((row) => matchesFilters(row, query));
}

export function getFilteredSurveyResponsesList(
  query: GetSurveyResponsesQuery,
): GetSurveyResponsesResponse {
  const filtered = getFilteredSurveyResponses(query);
  const total = filtered.length;
  const total_pages = Math.ceil(total / query.limit) || 0;
  const start = (query.page - 1) * query.limit;
  const responses = filtered.slice(start, start + query.limit).map(
    (row): SurveyResponseListItem => ({
      id: row.id,
      response_date: row.response_date,
      member_id: row.member_id,
      member_number: row.member_number,
      member_name: row.member_name,
      survey_id: row.survey_id,
      survey_name: row.survey_name,
      template_type: row.template_type,
      brand: row.brand,
      store_id: row.store_id,
      store_name: row.store_name,
      member_type: row.member_type,
      answered_count: row.answered_count,
      total_count: row.total_count,
      status: row.status,
    }),
  );

  return {
    responses,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages,
    },
  };
}

function pickSelectedSurvey(query: SurveyResponseQuery): SurveyTemplateDetail | undefined {
  const surveys = db.surveys.getList();
  const resolveSurveyDetail = (id?: string) => (id ? db.surveys.getById(id) : undefined);

  if (query.survey_id) {
    return resolveSurveyDetail(query.survey_id);
  }

  if (query.search) {
    const keyword = query.search.toLowerCase().trim();
    const match = surveys.find((survey) => survey.name.toLowerCase().includes(keyword));
    if (match) return resolveSurveyDetail(match.id);
  }

  return resolveSurveyDetail(surveys[0]?.id);
}

function buildChoiceStats(
  question: SurveyQuestion,
  rows: SurveyResponseDetail[],
): SurveyAnalyticsChoiceStat[] {
  const totalResponses = rows.length;
  return question.choices.map((choice) => {
    const count = rows.reduce((acc, row) => {
      const answer = row.answers.find((item) => item.question_no === question.no)?.answer ?? [];
      return acc + (answer.includes(choice.text) ? 1 : 0);
    }, 0);

    return {
      label: choice.text,
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 1000) / 10 : 0,
    };
  });
}

function buildFreeTextSamples(
  question: SurveyQuestion,
  rows: SurveyResponseDetail[],
): SurveyAnalyticsFreeTextSample[] {
  return rows
    .map((row) => {
      const answer = row.answers.find((item) => item.question_no === question.no)?.answer ?? [];
      const text = answer[0];
      if (!text) return undefined;
      return { text, answered_at: row.response_date };
    })
    .filter((sample): sample is SurveyAnalyticsFreeTextSample => Boolean(sample))
    .slice(0, 5);
}

function buildAnalyticsQuestions(
  survey: SurveyTemplateDetail | undefined,
  rows: SurveyResponseDetail[],
): SurveyAnalyticsQuestion[] {
  const questions = survey?.questions ?? [];

  return questions.map((question) => {
    if (question.format === 'free_text') {
      return {
        kind: 'free_text' as const,
        no: question.no,
        content: question.content,
        format: 'free_text' as const,
        samples: buildFreeTextSamples(question, rows),
      };
    }

    return {
      kind: 'select' as const,
      no: question.no,
      content: question.content,
      format: question.format,
      choices: buildChoiceStats(question, rows),
    };
  });
}

export function buildSurveyAnalyticsResponse(
  query: GetSurveyAnalyticsQuery,
): GetSurveyAnalyticsResponse {
  const selectedSurvey = pickSelectedSurvey(query);
  const surveys = db.surveys.getList();
  const defaultSurvey = query.survey_id ? undefined : db.surveys.getById(surveys[0]?.id ?? '');
  const survey = selectedSurvey ?? defaultSurvey;
  const surveyId = query.survey_id ?? survey?.id;
  const filtered = db.surveyReporting
    .getAll()
    .filter((row) => matchesFilters(row, { ...query, survey_id: surveyId }));

  const totalResponses = filtered.length;
  const completedResponses = filtered.filter((row) => row.status === 'completed').length;
  const responseRate =
    totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 1000) / 10 : 0;

  const firstRow = filtered[0];
  const context: SurveyAnalyticsContext = {
    survey_id: survey?.id ?? surveyId ?? 'S-001',
    survey_name: survey?.name ?? firstRow?.survey_name ?? '—',
    template_type: survey?.type ?? firstRow?.template_type ?? 'lifecycle',
    brand: firstRow?.brand ?? survey?.brand ?? 'fit365',
    store_id: firstRow?.store_id ?? 'store-001',
    store_name: firstRow?.store_name ?? '—',
    total_responses: totalResponses,
  };

  return {
    context,
    kpis: {
      total_responses: totalResponses,
      completed_responses: completedResponses,
      response_rate: responseRate,
    },
    questions: buildAnalyticsQuestions(survey, filtered),
  };
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildSurveyResponsesCsv(rows: SurveyResponseDetail[]): SurveyCsvExportResponse {
  const header = [
    '回答日',
    '会員番号',
    '会員名',
    'アンケート名',
    '種別',
    'ブランド',
    '店舗',
    '区分',
    '回答数',
    '状態',
  ];

  const csv = [
    header.join(','),
    ...rows.map((row) =>
      [
        formatSurveyDateOnly(row.response_date),
        row.member_number,
        row.member_name,
        row.survey_name,
        SURVEY_TYPE_LABELS[row.template_type],
        SURVEY_BRAND_LABELS[row.brand],
        row.store_name,
        SURVEY_RESPONSE_MEMBER_TYPE_LABELS[row.member_type],
        `${row.answered_count}/${row.total_count}問`,
        SURVEY_RESPONSE_STATUS_LABELS[row.status],
      ]
        .map((value) => csvEscape(value))
        .join(','),
    ),
  ].join('\n');

  return {
    message: 'CSVを作成しました',
    filename: `survey-responses-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`,
    csv,
    row_count: rows.length,
  };
}

export function buildSurveyAnalyticsCsv(
  response: GetSurveyAnalyticsResponse,
): SurveyCsvExportResponse {
  const summaryRows = [
    ['項目', '値'],
    ['アンケート名', response.context.survey_name],
    ['種別', SURVEY_TYPE_LABELS[response.context.template_type]],
    ['ブランド', SURVEY_BRAND_LABELS[response.context.brand]],
    ['店舗', response.context.store_name],
    ['総回答数', `${response.kpis.total_responses.toLocaleString()}件`],
    ['回答率', `${response.kpis.response_rate.toFixed(1)}%`],
  ];
  const header = ['設問番号', '設問内容', '種類', '項目', '件数', '割合', '回答日時'];

  const questionRows = response.questions.flatMap((question) => {
    if (question.kind === 'free_text') {
      return question.samples.map((sample) => [
        question.no,
        question.content,
        SURVEY_QUESTION_FORMAT_LABELS[question.format],
        sample.text,
        1,
        '',
        formatSurveyDateOnly(sample.answered_at),
      ]);
    }

    return question.choices.map((choice) => [
      question.no,
      question.content,
      SURVEY_QUESTION_FORMAT_LABELS[question.format],
      choice.label,
      choice.count,
      `${choice.percentage.toFixed(1)}%`,
      '',
    ]);
  });

  const csv = [
    ...summaryRows.map((row) => row.map((value) => csvEscape(value)).join(',')),
    '',
    header.join(','),
    ...questionRows.map((row) => row.map((value) => csvEscape(value)).join(',')),
  ].join('\n');

  return {
    message: 'CSVを作成しました',
    filename: `survey-analytics-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`,
    csv,
    row_count: summaryRows.length - 1 + questionRows.length,
  };
}
