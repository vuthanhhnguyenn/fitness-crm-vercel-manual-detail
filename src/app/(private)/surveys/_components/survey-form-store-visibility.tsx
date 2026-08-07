'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { SURVEY_QUESTION_FORMAT_LABELS } from '../_constants/constants';
import { type SurveyFormValues } from '../_schemas/survey-form.schema';

type VisibilityState = {
  questionVisible: Record<string, boolean>;
  choiceVisible: Record<string, boolean>;
};

function isChoiceQuestion(format: SurveyFormValues['questions'][number]['format']) {
  return format === 'single_choice' || format === 'multiple_choice';
}

function buildVisibilityState(questions: SurveyFormValues['questions']): VisibilityState {
  return {
    questionVisible: Object.fromEntries(questions.map((question) => [question.id, true])),
    choiceVisible: Object.fromEntries(
      questions.flatMap((question) =>
        question.choices.map((choice) => [`${question.id}-${choice.id}`, true]),
      ),
    ),
  };
}

type QuestionVisibilityContentProps = {
  questions: SurveyFormValues['questions'];
};

function SurveyFormQuestionVisibilityContent({
  questions,
}: Readonly<QuestionVisibilityContentProps>) {
  const [visibility, setVisibility] = useState<VisibilityState>(() =>
    buildVisibilityState(questions),
  );

  const hasChoiceQuestions = questions.some(
    (question) => isChoiceQuestion(question.format) && question.choices.length > 0,
  );

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-base">設問・回答選択肢の表示設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-muted-foreground mb-3 text-xs">
          各設問ごとに表示/非表示を切り替えられます。選択式の設問は回答選択肢も個別に切り替えできます。
        </p>

        {questions.length === 0 ? (
          <p className="text-muted-foreground text-xs">設問がありません。</p>
        ) : (
          <div className="flex flex-col gap-0">
            {questions.map((question) => {
              const isVisible = visibility.questionVisible[question.id] ?? true;
              const showChoices = isChoiceQuestion(question.format) && question.choices.length > 0;

              return (
                <div key={question.id} className="border-b last:border-b-0">
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={`text-sm ${!isVisible ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {question.content}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {SURVEY_QUESTION_FORMAT_LABELS[question.format]}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {isVisible ? '表示' : '非表示'}
                      </span>
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) =>
                          setVisibility((prev) => ({
                            ...prev,
                            questionVisible: {
                              ...prev.questionVisible,
                              [question.id]: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  {showChoices && (
                    <div className="bg-muted/30 mb-2 ml-6 overflow-hidden rounded-md border">
                      <div className="bg-muted/50 border-b px-3 py-2">
                        <span className="text-muted-foreground text-xs font-semibold">
                          回答選択肢の表示設定
                        </span>
                      </div>
                      <div className="px-3">
                        {question.choices.map((choice) => {
                          const choiceKey = `${question.id}-${choice.id}`;
                          const checked = visibility.choiceVisible[choiceKey] ?? true;
                          const disabled = !isVisible;

                          return (
                            <div
                              key={choice.id}
                              className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
                            >
                              <span
                                className={`flex-1 text-xs ${
                                  !checked || !isVisible ? 'text-muted-foreground line-through' : ''
                                }`}
                              >
                                {choice.text}
                              </span>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                  {checked ? '表示' : '非表示'}
                                </span>
                                <Switch
                                  checked={checked}
                                  disabled={disabled}
                                  onCheckedChange={(nextChecked) =>
                                    setVisibility((prev) => ({
                                      ...prev,
                                      choiceVisible: {
                                        ...prev.choiceVisible,
                                        [choiceKey]: nextChecked,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!hasChoiceQuestions && questions.length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            選択式の設問がないため、選択肢の表示設定はありません。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SurveyFormQuestionVisibilitySection() {
  const form = useFormContext<SurveyFormValues>();
  const questions = useWatch({ control: form.control, name: 'questions' }) ?? [];
  const visibilityKey = questions
    .map(
      (question) =>
        `${question.id}:${question.format}:${question.choices.map((choice) => choice.id).join(',')}`,
    )
    .join('|');

  return (
    <SurveyFormQuestionVisibilityContent key={visibilityKey || 'empty'} questions={questions} />
  );
}
