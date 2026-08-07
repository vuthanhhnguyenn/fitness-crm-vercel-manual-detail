import type {
  AreaScheduleKpiSummary,
  LessonScheduleKpiSummary,
  LessonScheduleListItem,
  StoreScheduleSummary,
} from '@/app/api/_schemas/lesson-schedule.schema';

export type LessonSchedulesType = {
  _rows: LessonScheduleListItem[];
  _seeded: boolean;
  _seed(): void;
  getList(): LessonScheduleListItem[];
  getById(id: string): LessonScheduleListItem | undefined;
  create(
    input: import('@/app/api/_schemas/lesson-schedule.schema').CreateLessonScheduleRequest & {
      overrideId?: string;
    },
  ): import('@/app/api/_schemas/lesson-schedule.schema').CreateLessonScheduleResponse;
  update(id: string, patch: Partial<LessonScheduleListItem>): LessonScheduleListItem | undefined;
  getKpiSummary(date: string): LessonScheduleKpiSummary;
  getStoreSummary(date: string): {
    areas: AreaScheduleKpiSummary[];
    stores: StoreScheduleSummary[];
  };
  checkInstructorAvailability(
    instructorId: string,
    date: string,
    startTime: string,
  ): import('@/app/api/_schemas/lesson-schedule.schema').InstructorAvailabilityResponse;
};
