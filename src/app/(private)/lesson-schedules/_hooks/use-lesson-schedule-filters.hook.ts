'use client';

import { formatISODateLocal } from '@/utils/date.util';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type {
  GetCrmLessonSchedulesData,
  GetCrmLessonSchedulesStoresSummaryData,
  GetCrmLessonSchedulesSummaryData,
} from '@/lib/api/types.gen';

export type ScheduleViewMode = 'day' | 'week' | 'list';
export type ScheduleAxis = 'store' | 'my_schedule';
export type ScheduleSortBy =
  | 'start_time'
  | 'lesson_name'
  | 'studio_name'
  | 'instructor_name'
  | 'booked_count'
  | 'status';

const VIEW_MODES: ScheduleViewMode[] = ['day', 'week', 'list'];
const AXES: ScheduleAxis[] = ['store', 'my_schedule'];
const SORT_ORDERS: ('asc' | 'desc')[] = ['asc', 'desc'];

function todayISO(): string {
  return formatISODateLocal(new Date());
}

function weekStartISO(from?: string): string {
  const d = from ? new Date(from) : new Date();
  const dow = d.getDay();
  const diff = (dow + 6) % 7; // Monday-first
  d.setDate(d.getDate() - diff);
  return formatISODateLocal(d);
}

export function useLessonScheduleFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      view: parseAsStringEnum<ScheduleViewMode>(VIEW_MODES).withDefault('day'),
      axis: parseAsStringEnum<ScheduleAxis>(AXES).withDefault('store'),
      date: parseAsString.withDefault(todayISO()),
      week_start: parseAsString.withDefault(weekStartISO()),
      store_id: parseAsString,
      studio_name: parseAsString,
      instructor_id: parseAsString,
      sort_by: parseAsString.withDefault('start_time'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(SORT_ORDERS).withDefault('asc'),
      focused_store_id: parseAsString,
    },
    { history: 'push', shallow: false },
  );

  function setDate(date: string) {
    setFilters({ date, week_start: weekStartISO(date) });
  }

  function goToPrev() {
    if (filters.view === 'week') {
      const d = new Date(filters.week_start);
      d.setDate(d.getDate() - 7);
      const iso = formatISODateLocal(d);
      setFilters({ week_start: iso, date: iso });
    } else {
      const d = new Date(filters.date);
      d.setDate(d.getDate() - 1);
      setDate(formatISODateLocal(d));
    }
  }

  function goToNext() {
    if (filters.view === 'week') {
      const d = new Date(filters.week_start);
      d.setDate(d.getDate() + 7);
      const iso = formatISODateLocal(d);
      setFilters({ week_start: iso, date: iso });
    } else {
      const d = new Date(filters.date);
      d.setDate(d.getDate() + 1);
      setDate(formatISODateLocal(d));
    }
  }

  function goToToday() {
    const today = todayISO();
    setFilters({ date: today, week_start: weekStartISO(today) });
  }

  const schedulesQueryParams: NonNullable<GetCrmLessonSchedulesData['query']> = {
    date: filters.view !== 'week' ? filters.date : undefined,
    week_start: filters.view === 'week' ? filters.week_start : undefined,
    store_id: filters.store_id ?? undefined,
    studio_name: filters.studio_name ?? undefined,
    instructor_id: filters.instructor_id ?? undefined,
    axis: filters.axis,
    sort_by: filters.sort_by as ScheduleSortBy,
    sort_order: filters.sort_order,
  };

  const kpiQueryParams: NonNullable<GetCrmLessonSchedulesSummaryData['query']> = {
    date: filters.date,
  };

  const storeSummaryQueryParams: NonNullable<GetCrmLessonSchedulesStoresSummaryData['query']> = {
    date: filters.date,
  };

  return {
    filters,
    setFilters,
    setDate,
    goToPrev,
    goToNext,
    goToToday,
    schedulesQueryParams,
    kpiQueryParams,
    storeSummaryQueryParams,
  };
}
