import type { ScheduleSummary } from '@/app/api/_schemas/lesson-content-detail.schema';

export type LessonContentSchedulesType = {
  getByMasterId(id: string): ScheduleSummary;
};
