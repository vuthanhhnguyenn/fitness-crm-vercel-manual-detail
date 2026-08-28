'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { getCrmSurveysByIdStoresByStoreIdVisibilityOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { SurveyStoreVisibility } from '@/lib/api/types.gen';

import { SURVEY_QUESTION_FORMAT_LABELS } from '../_constants/constants';
import { type SurveyFormValues } from '../_schemas/survey-form.schema';

type VisibilityState = {
  questionVisible: Record<string, boolean>;
  choiceVisible: Record<string, boolean>;
};

function isChoiceQuestion(format: SurveyFormValues['questions'][number]['format']) {
  return format === 'single_choice' || format === 'multiple_choice';
}

function buildVisibilityState(
  questions: SurveyFormValues['questions'],
  visibility?: SurveyStoreVisibility,
): VisibilityState {
  const visibilityByNo = new Map(visibility?.questions.map((question) => [question.no, question]));

  return {
    questionVisible: Object.fromEntries(
      questions.map((question, index) => {
        const storedQuestion = visibilityByNo.get(index + 1);
        return [question.id, storedQuestion?.visible ?? true];
      }),
    ),
    choiceVisible: Object.fromEntries(
      questions.flatMap((question, questionIndex) => {
        const storedQuestion = visibilityByNo.get(questionIndex + 1);
        const choiceVisibility = new Map(
          storedQuestion?.choices.map((choice) => [choice.order, choice]),
        );

        return question.choices.map((choice, choiceIndex) => {
          const storedChoice = choiceVisibility.get(choiceIndex + 1);
          return [`${question.id}-${choice.id}`, storedChoice?.visible ?? true];
        });
      }),
    ),
  };
}

function buildVisibilityPayload(
  questions: SurveyFormValues['questions'],
  state: VisibilityState,
): SurveyStoreVisibility['questions'] {
  return questions.map((question, questionIndex) => ({
    no: questionIndex + 1,
    visible: state.questionVisible[question.id] ?? true,
    choices: question.choices.map((choice, choiceIndex) => ({
      order: choiceIndex + 1,
      visible: state.choiceVisible[`${question.id}-${choice.id}`] ?? true,
    })),
  }));
}

type QuestionVisibilityContentProps = {
  storeId: string | null;
  questions: SurveyFormValues['questions'];
  visibility?: SurveyStoreVisibility;
  onChange?: (questions: SurveyStoreVisibility['questions']) => void;
};

function SurveyFormQuestionVisibilityContent({
  storeId,
  questions,
  visibility: initialVisibility,
  onChange,
}: Readonly<QuestionVisibilityContentProps>) {
  const [draftVisibility, setDraftVisibility] = useState<VisibilityState>(() =>
    buildVisibilityState(questions, initialVisibility),
  );

  useEffect(() => {
    onChange?.(buildVisibilityPayload(questions, draftVisibility));
  }, [draftVisibility, onChange, questions]);

  const hasChoiceQuestions = questions.some(
    (question) => isChoiceQuestion(question.format) && question.choices.length > 0,
  );

  if (!storeId) {
    return null;
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-4 pt-4 pb-3">
        <div>
          <CardTitle className="text-base">設問・回答選択肢の表示設定</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs">店舗: {storeId}</p>
        </div>
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
              const isVisible = draftVisibility.questionVisible[question.id] ?? true;
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
                          setDraftVisibility((prev) => ({
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
                          const checked = draftVisibility.choiceVisible[choiceKey] ?? true;
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
                                    setDraftVisibility((prev) => ({
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

export function SurveyFormQuestionVisibilitySection({
  surveyId,
  storeId,
  onChange,
}: Readonly<{
  surveyId: string;
  storeId: string | null;
  onChange?: (questions: SurveyStoreVisibility['questions']) => void;
}>) {
  const form = useFormContext<SurveyFormValues>();
  const questions = useWatch({ control: form.control, name: 'questions' }) ?? [];
  const visibilityKey = questions
    .map(
      (question) =>
        `${question.id}:${question.format}:${question.choices.map((choice) => choice.id).join(',')}`,
    )
    .join('|');

  const { data } = useQuery({
    ...getCrmSurveysByIdStoresByStoreIdVisibilityOptions({
      path: { id: surveyId, storeId: storeId ?? '' },
    }),
    enabled: Boolean(surveyId && storeId),
  });

  return (
    <SurveyFormQuestionVisibilityContent
      key={`${visibilityKey}:${data?.visibility.updated_at ?? 'empty'}`}
      storeId={storeId}
      questions={questions}
      visibility={data?.visibility}
      onChange={onChange}
    />
  );
}
