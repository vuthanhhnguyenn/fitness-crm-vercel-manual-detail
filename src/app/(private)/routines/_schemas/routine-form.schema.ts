import { z } from 'zod';

import type { RoutineDetail, UpsertRoutineBody } from '@/lib/api/types.gen';

import {
  ROUTINE_DUPLICATE_EXERCISE_MESSAGE,
  ROUTINE_PUBLISH_REQUIRES_EXERCISE_MESSAGE,
  ROUTINE_RPE_VALIDATION_MESSAGE,
  ROUTINE_SET_DEFAULTS,
  ROUTINE_SET_VALIDATION_MESSAGE,
} from '../_constants/routine.constants';

export function isNonNegativeNumberString(value: string): boolean {
  if (value.trim() === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function isValidRpeString(value: string): boolean {
  if (value.trim() === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10;
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberToString(value: number | null): string {
  return value === null ? '' : String(value);
}

export const routineFormSetSchema = z.object({
  reps: z.string(),
  weight: z.string(),
  time: z.string(),
  distance: z.string(),
  rpe: z.string(),
});

export const routineFormExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  toolName: z.string(),
  hqComment: z.string(),
  sets: z.array(routineFormSetSchema),
});

export const routineFormSchema = z
  .object({
    routineCode: z.string(),
    name: z.string().trim().min(1, 'ルーティン名を入力してください'),
    description: z.string(),
    categoryId: z.string().min(1, 'ルーティンカテゴリを選択してください'),
    thumbnailS3Keys: z.array(z.string()),
    isPublished: z.boolean(),
    exercises: z.array(routineFormExerciseSchema),
  })
  .superRefine((value, ctx) => {
    const pickedExerciseIds = value.exercises
      .map((exercise) => exercise.exerciseId)
      .filter(Boolean);
    const hasDuplicateExercise = new Set(pickedExerciseIds).size !== pickedExerciseIds.length;
    if (hasDuplicateExercise) {
      ctx.addIssue({
        code: 'custom',
        path: ['exercises'],
        message: ROUTINE_DUPLICATE_EXERCISE_MESSAGE,
      });
    }

    const hasInvalidSet = value.exercises.some((exercise) =>
      exercise.sets.some(
        (set) =>
          !isNonNegativeNumberString(set.reps) ||
          !isNonNegativeNumberString(set.weight) ||
          !isNonNegativeNumberString(set.time) ||
          !isNonNegativeNumberString(set.distance),
      ),
    );
    if (hasInvalidSet) {
      ctx.addIssue({
        code: 'custom',
        path: ['exercises'],
        message: ROUTINE_SET_VALIDATION_MESSAGE,
      });
    }

    const hasInvalidRpe = value.exercises.some((exercise) =>
      exercise.sets.some((set) => !isValidRpeString(set.rpe)),
    );
    if (hasInvalidRpe) {
      ctx.addIssue({
        code: 'custom',
        path: ['exercises'],
        message: ROUTINE_RPE_VALIDATION_MESSAGE,
      });
    }

    if (value.isPublished && pickedExerciseIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['isPublished'],
        message: ROUTINE_PUBLISH_REQUIRES_EXERCISE_MESSAGE,
      });
    }
  });

export type RoutineFormValues = z.infer<typeof routineFormSchema>;
export type RoutineFormExerciseValues = z.infer<typeof routineFormExerciseSchema>;
export type RoutineFormSetValues = z.infer<typeof routineFormSetSchema>;

export function createEmptyRoutineFormSet(weight = ''): RoutineFormSetValues {
  return {
    reps: ROUTINE_SET_DEFAULTS.reps,
    weight,
    time: ROUTINE_SET_DEFAULTS.time,
    distance: '',
    rpe: ROUTINE_SET_DEFAULTS.rpe,
  };
}

export function createEmptyRoutineFormExercise(): RoutineFormExerciseValues {
  return {
    exerciseId: '',
    exerciseName: '',
    toolName: '',
    hqComment: '',
    sets: [createEmptyRoutineFormSet()],
  };
}

export function createEmptyRoutineFormValues(): RoutineFormValues {
  return {
    routineCode: '保存後に自動採番されます',
    name: '',
    description: '',
    categoryId: '',
    thumbnailS3Keys: [],
    isPublished: false,
    exercises: [],
  };
}

export function mapRoutineDetailToFormValues(routine: RoutineDetail): RoutineFormValues {
  return {
    routineCode: routine.routineCode,
    name: routine.name,
    description: routine.description ?? '',
    categoryId: routine.categoryId,
    thumbnailS3Keys: routine.thumbnailS3Keys,
    isPublished: routine.publishStatus === 'published',
    exercises: routine.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      // RoutineDetail (backend-api.md / data-model.md RoutineExercise) has no toolName field —
      // it's resolved client-side from the exercise record when needed (see RoutineFormExerciseRow).
      toolName: '',
      hqComment: exercise.hqComment ?? '',
      sets: exercise.sets.map((set) => ({
        reps: numberToString(set.targetReps),
        weight: numberToString(set.targetWeightKg),
        time: numberToString(set.targetDurationSeconds),
        distance: numberToString(set.targetDistanceM),
        rpe: numberToString(set.targetRpe),
      })),
    })),
  };
}

export function mapRoutineFormValuesToBody(values: RoutineFormValues): UpsertRoutineBody {
  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    description: values.description.trim() ? values.description.trim() : null,
    thumbnailS3Keys: values.thumbnailS3Keys,
    exercises: values.exercises
      .filter((exercise) => exercise.exerciseId)
      .map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        sortOrder: index,
        hqComment: exercise.hqComment.trim() ? exercise.hqComment.trim() : null,
        sets: exercise.sets.map((set) => ({
          targetReps: toNumberOrNull(set.reps),
          targetWeightKg: toNumberOrNull(set.weight),
          targetDurationSeconds: toNumberOrNull(set.time),
          targetDistanceM: toNumberOrNull(set.distance),
          targetRpe: toNumberOrNull(set.rpe),
          setType: 'normal' as const,
        })),
      })),
  };
}
