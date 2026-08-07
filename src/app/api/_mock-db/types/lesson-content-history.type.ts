import type { ChangeHistory } from '@/app/api/_schemas/lesson-content-detail.schema';

export type LessonContentHistoryType = {
  getByMasterId(id: string): ChangeHistory;
};
