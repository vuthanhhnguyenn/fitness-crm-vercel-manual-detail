import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { GetCrmSurveysByIdResponse } from '@/lib/api/types.gen';

import { SURVEY_QUESTION_FORMAT_LABELS } from '../../_constants/constants';

type SurveyDetail = NonNullable<GetCrmSurveysByIdResponse>['survey'];

interface SurveyQuestionsSectionProps {
  questions: SurveyDetail['questions'];
}

export function SurveyQuestionsSection({ questions }: SurveyQuestionsSectionProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="py-4">
        <CardTitle className="text-sm">設問一覧</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-xs font-semibold">#</TableHead>
            <TableHead className="text-xs font-semibold">設問内容</TableHead>
            <TableHead className="w-[120px] text-xs font-semibold">回答形式</TableHead>
            <TableHead className="w-16 text-center text-xs font-semibold">必答</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.no}>
              <TableCell className="text-muted-foreground align-top text-xs">
                {question.no}
              </TableCell>
              <TableCell className="align-top text-xs font-medium">
                <div className="flex flex-col gap-2">
                  <span>{question.content}</span>
                  {question.choices.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {question.choices.map((choice) => (
                        <Badge
                          key={`${question.no}-${choice.order}`}
                          variant="outline"
                          className="bg-muted/40 text-[10px] font-normal"
                        >
                          {choice.order}. {choice.text}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">
                      （自由記述のため選択肢なし）
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top">
                <Badge variant="outline" className="text-[10px]">
                  {SURVEY_QUESTION_FORMAT_LABELS[question.format]}
                </Badge>
              </TableCell>
              <TableCell className="text-center align-top text-xs">
                {question.required ? '○' : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
