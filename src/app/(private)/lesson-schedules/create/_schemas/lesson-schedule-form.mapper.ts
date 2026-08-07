import type { PostCrmLessonSchedulesCreateData } from '@/lib/api/types.gen';

import type { LessonScheduleFormSubmitValues } from './lesson-schedule-form.schema';

export function lessonScheduleFormValuesToRequestBody(
  values: LessonScheduleFormSubmitValues,
): NonNullable<PostCrmLessonSchedulesCreateData['body']> {
  const body: NonNullable<PostCrmLessonSchedulesCreateData['body']> = {
    lesson_type: values.lesson_type,
    store_id: values.store_id,
    schedule_mode: values.schedule_mode,
    start_time: values.start_time,
    lesson_id: values.lesson_id,
    instructor_ids: values.instructor_ids,
    is_published: values.is_published,
    trial_enabled: values.trial_enabled,
    skip_holidays: values.skip_holidays,
  };

  if (values.lesson_type === 'studio') {
    body.studio_id = values.studio_id;
    body.capacity = values.capacity;
  }

  if (values.lesson_type === 'personal') {
    body.course_type = values.course_type;
  }

  if (values.schedule_mode === 'single') {
    body.date = values.date;
  }

  if (values.schedule_mode === 'recurring') {
    body.start_date = values.start_date;
    body.repeat_type = values.repeat_type;
    body.days_of_week = values.days_of_week;
    body.end_condition = values.end_condition;
    body.end_date = values.end_date || undefined;
    body.end_count = values.end_count || undefined;
  }

  if (values.trial_enabled) {
    body.trial_mode = values.trial_mode;
    body.trial_capacity = values.trial_capacity;
  }

  return body;
}
