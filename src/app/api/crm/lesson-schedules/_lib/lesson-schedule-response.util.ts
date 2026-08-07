import type { LessonScheduleListItem } from '@/app/api/_schemas/lesson-schedule.schema';
import type {
  GetLessonSchedulesQuery,
  GetStoreSummaryQuery,
} from '@/app/api/_schemas/lesson-schedule.schema';

/**
 * Filter lesson schedules by query parameters.
 * Supports: date (day view), week_start (week view), store_id, studio_name, instructor_id, axis.
 */
export function filterSchedules(
  rows: LessonScheduleListItem[],
  query: GetLessonSchedulesQuery,
  currentUserId?: string,
): LessonScheduleListItem[] {
  let filtered = [...rows];

  // Axis filter: my_schedule returns only sessions where instructor matches current user
  if (query.axis === 'my_schedule' && currentUserId) {
    filtered = filtered.filter((r) => r.instructor_id === currentUserId);
  }

  // Date/week filter
  if (query.week_start) {
    const weekStart = new Date(query.week_start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    filtered = filtered.filter((r) => {
      const d = new Date(r.start_time);
      return d >= weekStart && d < weekEnd;
    });
  } else if (query.date) {
    filtered = filtered.filter((r) => r.start_time.startsWith(query.date!));
  }

  // Store filter
  if (query.store_id) {
    filtered = filtered.filter((r) => r.store_id === query.store_id);
  }

  // Studio filter
  if (query.studio_name) {
    const studio = query.studio_name.toLowerCase();
    filtered = filtered.filter((r) => r.studio_name?.toLowerCase().includes(studio));
  }

  // Instructor filter
  if (query.instructor_id) {
    filtered = filtered.filter((r) => r.instructor_id === query.instructor_id);
  }

  return filtered;
}

/**
 * Sort lesson schedules.
 */
export function sortSchedules(
  rows: LessonScheduleListItem[],
  sortBy: GetLessonSchedulesQuery['sort_by'] = 'start_time',
  sortOrder: 'asc' | 'desc' = 'asc',
): LessonScheduleListItem[] {
  return [...rows].sort((a, b) => {
    const key = sortBy ?? 'start_time';
    const aVal = a[key as keyof LessonScheduleListItem] ?? '';
    const bVal = b[key as keyof LessonScheduleListItem] ?? '';
    const cmp =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'ja');
    return sortOrder === 'asc' ? cmp : -cmp;
  });
}

/**
 * Sort store summary rows.
 */
export function sortStoreSummaries<
  T extends {
    store_name: string;
    total_lessons: number;
    occupancy_rate: number;
    alert_count: number;
  },
>(rows: T[], query: GetStoreSummaryQuery): T[] {
  const sortBy = query.sort_by ?? 'store_name';
  const sortOrder = query.sort_order ?? 'asc';
  return [...rows].sort((a, b) => {
    const aVal = a[sortBy as keyof T] ?? '';
    const bVal = b[sortBy as keyof T] ?? '';
    const cmp =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'ja');
    return sortOrder === 'asc' ? cmp : -cmp;
  });
}
