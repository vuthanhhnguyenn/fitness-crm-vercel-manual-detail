import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmSurveysResponsesByResponseIdResponse } from '@/lib/api/types.gen';

import { SURVEY_QUESTION_FORMAT_LABELS } from '../../../_constants/constants';

type SurveyResponseDetail = NonNullable<GetCrmSurveysResponsesByResponseIdResponse>['response'];

interface ResponseAnswersSectionProps {
  answers: SurveyResponseDetail['answers'];
}

export function ResponseAnswersSection({ answers }: ResponseAnswersSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">回答内容（{answers.length}問）</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-5">
          {answers.map((answer) => {
            const hasAnswer = answer.answer.length > 0;
            const isFreeText = answer.format === 'free_text';

            return (
              <div
                key={answer.question_no}
                className="border-border flex flex-col gap-2 border-b border-dashed pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 shrink-0 text-xs">
                    Q{answer.question_no}
                  </span>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-medium">{answer.question}</p>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {SURVEY_QUESTION_FORMAT_LABELS[answer.format]}
                    </Badge>
                  </div>
                </div>

                <div className="ml-8">
                  {hasAnswer ? (
                    isFreeText ? (
                      <p className="bg-muted/40 rounded-md p-3 text-sm leading-relaxed">
                        {answer.answer[0]}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {answer.answer.map((item) => (
                          <Badge
                            key={`${answer.question_no}-${item}`}
                            variant="outline"
                            className="bg-info/15 text-info border-info/20 text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-muted-foreground text-xs">未回答</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
