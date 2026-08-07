import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmSurveysAnalyticsResponse } from '@/lib/api/types.gen';

import { SURVEY_QUESTION_FORMAT_LABELS, formatSurveyDateOnly } from '../../_constants/constants';

type SurveyAnalyticsQuestion = GetCrmSurveysAnalyticsResponse['questions'][number];

function BarChartRow({
  label,
  percentage,
  count,
}: {
  label: string;
  percentage: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-right text-xs">{label}</span>
      <div className="bg-muted h-6 flex-1 overflow-hidden rounded-sm">
        <div className="bg-primary/80 h-full rounded-sm" style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-muted-foreground w-28 shrink-0 text-xs">
        {percentage.toFixed(1)}% ({count}件)
      </span>
    </div>
  );
}

function SelectQuestionCard({
  question,
}: {
  question: Extract<SurveyAnalyticsQuestion, { kind: 'select' }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">
            設問{question.no}: {question.content}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {SURVEY_QUESTION_FORMAT_LABELS[question.format]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {question.choices.map((choice) => (
          <BarChartRow
            key={choice.label}
            label={choice.label}
            percentage={choice.percentage}
            count={choice.count}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function FreeTextQuestionCard({
  question,
}: {
  question: Extract<SurveyAnalyticsQuestion, { kind: 'free_text' }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">
            設問{question.no}: {question.content}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {SURVEY_QUESTION_FORMAT_LABELS[question.format]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3 text-xs">回答例（直近5件）:</p>
        <ul className="flex flex-col gap-2">
          {question.samples.length > 0 ? (
            question.samples.map((sample) => (
              <li key={`${sample.answered_at}-${sample.text}`} className="flex items-start gap-2">
                <span className="text-muted-foreground shrink-0 text-xs">-</span>
                <span className="flex-1 text-sm">「{sample.text}」</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  — {formatSurveyDateOnly(sample.answered_at)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-sm">回答例はありません</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export function SurveyAnalyticsQuestionCards({
  questions,
}: {
  questions: SurveyAnalyticsQuestion[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) =>
        question.kind === 'select' ? (
          <SelectQuestionCard key={question.no} question={question} />
        ) : (
          <FreeTextQuestionCard key={question.no} question={question} />
        ),
      )}
    </div>
  );
}
