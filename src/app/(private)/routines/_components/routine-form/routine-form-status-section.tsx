'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { ROUTINE_PUBLISH_REQUIRES_EXERCISE_MESSAGE } from '../../_constants/routine.constants';
import type { RoutineFormValues } from '../../_schemas/routine-form.schema';

export function RoutineFormStatusSection() {
  const form = useFormContext<RoutineFormValues>();
  const [attemptedPublish, setAttemptedPublish] = useState(false);

  const isPublished = useWatch({ control: form.control, name: 'isPublished' });
  const exercises = useWatch({ control: form.control, name: 'exercises' });
  const validExerciseCount = exercises.filter((exercise) => exercise.exerciseId).length;
  const submitError = form.formState.errors.isPublished?.message;
  const showPublishWarning = Boolean(
    submitError || ((attemptedPublish || isPublished) && validExerciseCount === 0),
  );

  const handlePublishToggle = (checked: boolean) => {
    if (checked) setAttemptedPublish(true);
    if (checked && validExerciseCount === 0) {
      return;
    }
    form.setValue('isPublished', checked, { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Label className="text-sm">ルーティンの公開/非公開</Label>
            <p className="text-muted-foreground text-xs">
              公開にすると、モバイルアプリで会員にルーティンが表示されます
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">非公開</span>
            <Switch
              checked={isPublished}
              onCheckedChange={handlePublishToggle}
              aria-invalid={Boolean(submitError)}
            />
            <span className="text-sm font-medium">公開</span>
          </div>
        </div>
        {showPublishWarning && (
          <p className="text-destructive mt-2 text-xs">
            {submitError || ROUTINE_PUBLISH_REQUIRES_EXERCISE_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
