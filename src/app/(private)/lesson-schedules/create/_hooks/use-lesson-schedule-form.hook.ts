'use client';

import { type UseFormReturn, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  type LessonScheduleFormSubmitValues,
  type LessonScheduleFormValues,
  emptyLessonScheduleFormValues,
  lessonScheduleFormSchema,
} from '../_schemas/lesson-schedule-form.schema';

export function useLessonScheduleForm(): UseFormReturn<
  LessonScheduleFormValues,
  unknown,
  LessonScheduleFormSubmitValues
> {
  return useForm<LessonScheduleFormValues, unknown, LessonScheduleFormSubmitValues>({
    resolver: zodResolver(lessonScheduleFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyLessonScheduleFormValues,
  });
}
