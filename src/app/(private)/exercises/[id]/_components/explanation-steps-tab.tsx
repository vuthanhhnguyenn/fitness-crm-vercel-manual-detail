'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmExercisesByIdResponse } from '@/lib/api/types.gen';

import {
  EXERCISE_STEP_TRANSLATION_HELP,
  EXERCISE_STEP_TRANSLATION_LABEL,
} from '../../_constants/constants';

type ExerciseDetail = NonNullable<GetCrmExercisesByIdResponse>['exercise'];

type ExplanationStepsTabProps = {
  explanationSteps: ExerciseDetail['explanationSteps'];
};

export function ExplanationStepsTab({ explanationSteps }: Readonly<ExplanationStepsTabProps>) {
  return (
    <div className="space-y-4">
      {explanationSteps.map((step) => (
        <Card key={step.step}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {step.step}
              </div>
              <CardTitle className="text-base font-semibold">{step.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{step.textJa || '未入力'}</p>
            <div className="bg-muted/40 rounded-md border px-3 py-3">
              <p className="text-muted-foreground mb-1 text-[10px]">
                {EXERCISE_STEP_TRANSLATION_LABEL}
              </p>
              <p className="text-muted-foreground text-xs italic">
                {step.textEn || `(${EXERCISE_STEP_TRANSLATION_HELP})`}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
