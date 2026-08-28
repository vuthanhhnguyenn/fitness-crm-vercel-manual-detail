'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  ROUTINE_RPE_VALIDATION_MESSAGE,
  ROUTINE_SET_VALIDATION_MESSAGE,
} from '../../_constants/routine.constants';
import {
  type RoutineFormValues,
  createEmptyRoutineFormExercise,
  isNonNegativeNumberString,
  isValidRpeString,
} from '../../_schemas/routine-form.schema';
import { RoutineFormExerciseRow } from './routine-form-exercise-row';

export function RoutineFormExerciseCompositionSection() {
  const form = useFormContext<RoutineFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  const exercises = useWatch({ control: form.control, name: 'exercises' });
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const hasInvalidSet = exercises.some((exercise) =>
    exercise.sets.some(
      (set) =>
        !isNonNegativeNumberString(set.reps) ||
        !isNonNegativeNumberString(set.weight) ||
        !isNonNegativeNumberString(set.time) ||
        !isNonNegativeNumberString(set.distance),
    ),
  );
  const hasInvalidRpe = exercises.some((exercise) =>
    exercise.sets.some((set) => !isValidRpeString(set.rpe)),
  );

  return (
    <Card>
      <CardContent className="px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
            3
          </div>
          <h3 className="text-sm font-bold">エクササイズ構成</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-xs">
          ルーティンに含めるエクササイズを順番に登録してください。各エクササイズにセットを追加できます。
        </p>

        {fields.length === 0 ? (
          <div className="text-muted-foreground mb-4 flex flex-col items-center gap-2 rounded-md border border-dashed p-8">
            <p className="text-sm">エクササイズが未登録です</p>
            <p className="text-xs">下のボタンから追加してください</p>
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-4">
            {fields.map((field, index) => (
              <RoutineFormExerciseRow
                key={field.id}
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onDelete={() => remove(index)}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => append(createEmptyRoutineFormExercise())}
        >
          <Plus className="size-4" />
          エクササイズを追加
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">
          合計 {fields.length} 種目 / {totalSets} セット
        </p>
        {hasInvalidSet && (
          <p className="text-destructive mt-3 text-xs">{ROUTINE_SET_VALIDATION_MESSAGE}</p>
        )}
        {hasInvalidRpe && (
          <p className="text-destructive mt-1 text-xs">{ROUTINE_RPE_VALIDATION_MESSAGE}</p>
        )}
      </CardContent>
    </Card>
  );
}
