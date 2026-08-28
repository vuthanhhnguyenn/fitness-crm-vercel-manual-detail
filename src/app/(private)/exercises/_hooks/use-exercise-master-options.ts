import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  getCrmExerciseCategoriesOptions,
  getCrmExerciseMusclesOptions,
  getCrmExerciseToolTypesOptions,
  getCrmExerciseTypesOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { ExerciseMasterListItem, ToolTypeCode } from '@/lib/api/types.gen';

export type ExerciseMasterOption<TCode extends string = string> = {
  id: string;
  code: TCode;
  label: string;
};

function mapMasterOptions<TCode extends string = string>(
  items: ExerciseMasterListItem[] | undefined,
): ExerciseMasterOption<TCode>[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    code: item.code as TCode,
    label: item.name,
  }));
}

export function useExerciseMasterOptions() {
  const categoryQuery = useQuery({
    ...getCrmExerciseCategoriesOptions(),
  });
  const muscleQuery = useQuery({
    ...getCrmExerciseMusclesOptions(),
  });
  const toolQuery = useQuery({
    ...getCrmExerciseToolTypesOptions(),
  });
  const typeQuery = useQuery({
    ...getCrmExerciseTypesOptions(),
  });

  const categoryOptions = useMemo(
    () => mapMasterOptions(categoryQuery.data?.items),
    [categoryQuery.data?.items],
  );
  const primaryMuscleOptions = useMemo(
    () => mapMasterOptions(muscleQuery.data?.items),
    [muscleQuery.data?.items],
  );
  const toolOptions = useMemo(
    () => mapMasterOptions<ToolTypeCode>(toolQuery.data?.items),
    [toolQuery.data?.items],
  );
  const typeOptions = useMemo(
    () => mapMasterOptions(typeQuery.data?.items),
    [typeQuery.data?.items],
  );
  const bodyweightToolId = useMemo(
    () => toolOptions.find((item) => item.code === 'none')?.id ?? null,
    [toolOptions],
  );

  return {
    categoryOptions,
    primaryMuscleOptions,
    toolOptions,
    typeOptions,
    bodyweightToolId,
  };
}
