'use client';

import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';

import { OptionalMark } from '@/components/common/field-marker';
import { SearchableSelect } from '@/components/common/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmExercisesByIdOptions,
  getCrmExercisesOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { ExerciseListItem } from '@/lib/api/types.gen';

import { getDefaultWeightByToolName } from '../../_constants/routine.constants';
import {
  type RoutineFormValues,
  createEmptyRoutineFormSet,
  isNonNegativeNumberString,
  isValidRpeString,
} from '../../_schemas/routine-form.schema';

const EXERCISE_PICKER_SEARCH_LIMIT = 50;

type RoutineFormSetRowProps = {
  exerciseIndex: number;
  setIndex: number;
  onCopy: () => void;
  onRemove: () => void;
};

function RoutineFormSetRow({ exerciseIndex, setIndex, onCopy, onRemove }: RoutineFormSetRowProps) {
  const form = useFormContext<RoutineFormValues>();
  const reps = useWatch({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets.${setIndex}.reps`,
  });
  const weight = useWatch({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets.${setIndex}.weight`,
  });
  const time = useWatch({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets.${setIndex}.time`,
  });
  const distance = useWatch({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets.${setIndex}.distance`,
  });
  const rpe = useWatch({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets.${setIndex}.rpe`,
  });

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-center text-xs font-medium">
        {setIndex + 1}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="h-8 text-center text-xs"
          placeholder="-"
          aria-invalid={!isNonNegativeNumberString(reps ?? '')}
          {...form.register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="h-8 text-center text-xs"
          placeholder="-"
          aria-invalid={!isNonNegativeNumberString(weight ?? '')}
          {...form.register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="h-8 text-center text-xs"
          placeholder="-"
          aria-invalid={!isNonNegativeNumberString(time ?? '')}
          {...form.register(`exercises.${exerciseIndex}.sets.${setIndex}.time`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="h-8 text-center text-xs"
          placeholder="-"
          aria-invalid={!isNonNegativeNumberString(distance ?? '')}
          {...form.register(`exercises.${exerciseIndex}.sets.${setIndex}.distance`)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          max={10}
          className="h-8 text-center text-xs"
          placeholder="0"
          aria-invalid={!isValidRpeString(rpe ?? '')}
          {...form.register(`exercises.${exerciseIndex}.sets.${setIndex}.rpe`)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title="このセットをコピー"
            onClick={onCopy}
          >
            <Copy className="text-muted-foreground size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title="このセットを削除"
            onClick={onRemove}
          >
            <Trash2 className="text-destructive size-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

type RoutineFormExerciseRowProps = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function RoutineFormExerciseRow({
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Readonly<RoutineFormExerciseRowProps>) {
  const form = useFormContext<RoutineFormValues>();
  const exerciseId = useWatch({ control: form.control, name: `exercises.${index}.exerciseId` });
  const exerciseName = useWatch({ control: form.control, name: `exercises.${index}.exerciseName` });
  const toolName = useWatch({ control: form.control, name: `exercises.${index}.toolName` });
  const exercises = useWatch({ control: form.control, name: 'exercises' });

  // Existing routines loaded for edit have no toolName on RoutineExercise (not part of the
  // backend-api.md / data-model.md contract) — resolve it from the exercise record itself,
  // per Decision R5 (research.md), only when it isn't already known from a fresh pick.
  const { data: loadedExerciseDetail } = useQuery({
    ...getCrmExercisesByIdOptions({ path: { id: exerciseId } }),
    enabled: Boolean(exerciseId) && !toolName,
  });
  const resolvedToolName = toolName || loadedExerciseDetail?.exercise.toolName || '';

  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const { data: exercisesData, isFetching: isExercisesFetching } = useQuery({
    ...getCrmExercisesOptions({
      query: {
        publishStatus: 'public',
        limit: EXERCISE_PICKER_SEARCH_LIMIT,
        search: exerciseSearch || undefined,
      },
    }),
    enabled: isExercisePickerOpen,
  });

  const pickedByOtherRows = new Set(
    exercises
      .filter((_, otherIndex) => otherIndex !== index)
      .map((exercise) => exercise.exerciseId)
      .filter(Boolean),
  );
  const exerciseOptions = (exercisesData?.items ?? []).filter(
    (exercise) => !pickedByOtherRows.has(exercise.id),
  );

  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
    insert: insertSet,
  } = useFieldArray({
    control: form.control,
    name: `exercises.${index}.sets` as const,
  });

  const handlePickExercise = (picked: ExerciseListItem) => {
    const defaultWeight = String(getDefaultWeightByToolName(picked.toolName));
    form.setValue(`exercises.${index}.exerciseId`, picked.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`exercises.${index}.exerciseName`, picked.nameJa, { shouldDirty: true });
    form.setValue(`exercises.${index}.toolName`, picked.toolName, { shouldDirty: true });

    form.getValues(`exercises.${index}.sets`).forEach((set, setIndex) => {
      if (set.weight === '') {
        form.setValue(`exercises.${index}.sets.${setIndex}.weight`, defaultWeight, {
          shouldDirty: true,
        });
      }
    });
  };

  const handleAddSet = () => {
    const defaultWeight = resolvedToolName
      ? String(getDefaultWeightByToolName(resolvedToolName))
      : '';
    appendSet(createEmptyRoutineFormSet(defaultWeight));
  };

  const handleCopySet = (setIndex: number) => {
    const source = form.getValues(`exercises.${index}.sets.${setIndex}`);
    insertSet(setIndex + 1, { ...source });
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
        <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <SearchableSelect<ExerciseListItem>
            value={exerciseId || null}
            valueLabel={exerciseName || undefined}
            options={exerciseOptions}
            placeholder="エクササイズを選択"
            searchPlaceholder="エクササイズ名を検索..."
            emptyMessage="該当なし"
            loadingMessage="読み込み中..."
            isLoading={isExercisesFetching}
            open={isExercisePickerOpen}
            onOpenChange={setIsExercisePickerOpen}
            onSearchChange={setExerciseSearch}
            onSelect={(exercise) => exercise && handlePickExercise(exercise)}
            getOptionKey={(exercise) => exercise.id}
            getOptionLabel={(exercise) => exercise.nameJa}
            triggerClassName="h-8 w-full text-xs font-normal"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onDelete}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="w-[50px] text-center text-xs font-semibold">セット</TableHead>
            <TableHead className="text-center text-xs font-semibold">Rep数</TableHead>
            <TableHead className="text-center text-xs font-semibold">重量(kg)</TableHead>
            <TableHead className="text-center text-xs font-semibold">時間(秒)</TableHead>
            <TableHead className="text-center text-xs font-semibold">距離(m)</TableHead>
            <TableHead className="text-center text-xs font-semibold">RPE</TableHead>
            <TableHead className="w-[40px] text-xs font-semibold" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {setFields.map((setField, setIndex) => (
            <RoutineFormSetRow
              key={setField.id}
              exerciseIndex={index}
              setIndex={setIndex}
              onCopy={() => handleCopySet(setIndex)}
              onRemove={() => removeSet(setIndex)}
            />
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleAddSet}
        >
          <Plus className="size-3" />
          セットを追加
        </Button>
      </div>

      <div className="border-t px-3 py-2">
        <Label className="text-muted-foreground mb-1 block text-xs font-medium">
          本部コメント
          <OptionalMark />
        </Label>
        <Textarea
          className="min-h-[56px] text-xs leading-relaxed"
          placeholder="注意事項・フォームポイント等を入力"
          maxLength={TEXTAREA_MAX_LENGTH}
          {...form.register(`exercises.${index}.hqComment`)}
        />
      </div>
    </div>
  );
}
