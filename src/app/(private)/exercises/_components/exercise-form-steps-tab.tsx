'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import { EXERCISE_STEP_LABELS } from '../_constants/constants';
import type { ExerciseFormInput } from '../_schemas/exercise-form.schema';

type ExerciseFormStepsTabProps = {
  hasIncompleteSteps: boolean;
};

export function ExerciseFormStepsTab({ hasIncompleteSteps }: Readonly<ExerciseFormStepsTabProps>) {
  const form = useFormContext<ExerciseFormInput>();
  const publishStatus = useWatch({ control: form.control, name: 'publishStatus' });
  const explanationSteps = useWatch({
    control: form.control,
    name: 'explanationSteps',
    defaultValue: [],
  });

  return (
    <div className="mt-4 space-y-6">
      {publishStatus === 'public' && hasIncompleteSteps ? (
        <Alert className="border-warning/50 bg-warning/15">
          <AlertTriangle className="text-warning size-4" />
          <AlertTitle>解説ステップが未入力です</AlertTitle>
          <AlertDescription className="text-xs">
            公開ステータスで保存すると、モバイルアプリ側でステップが表示されません。公開前にステップ0〜4すべての入力を推奨します。
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">解説ステップ</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <p className="text-muted-foreground mb-4 text-xs">
            各ステップのテキストを入力してください。英語テキストは自動翻訳で生成されます。公開前にステップ0〜4すべての入力を推奨します。
          </p>
          <div className="flex flex-col gap-4">
            {EXERCISE_STEP_LABELS.map(({ step, label }, index) => (
              <div key={step} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                    {step}
                  </div>
                  <p className="text-sm font-semibold">{label}</p>
                </div>
                <FormField
                  control={form.control}
                  name={`explanationSteps.${index}.textJa`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder={`ステップ${step}の内容を入力`} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="bg-muted/30 rounded-md border px-3 py-2">
                  <p className="text-muted-foreground mb-1 text-[10px]">
                    英語名（未入力時は自動翻訳）
                  </p>
                  <p className="text-muted-foreground min-h-8 text-xs whitespace-pre-wrap">
                    {explanationSteps[index]?.textEn?.trim() ? explanationSteps[index]?.textEn : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
