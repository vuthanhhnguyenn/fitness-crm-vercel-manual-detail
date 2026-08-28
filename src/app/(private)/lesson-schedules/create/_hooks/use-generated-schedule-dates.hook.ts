import { useMemo } from 'react';
import { type Control, useWatch } from 'react-hook-form';

import { DAY_OF_WEEK_LABELS } from '../_constants/constants';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';

export interface GeneratedScheduleDate {
  isoDate: string;
  date: string;
  dow: string;
  time: string;
  conflict: boolean;
}

const HOLIDAYS_MOCK = [
  '2026-05-03',
  '2026-05-04',
  '2026-05-05',
  '2026-07-20',
  '2026-08-11',
  '2026-09-21',
  '2026-10-12',
  '2026-11-03',
  '2026-11-23',
];

export function useGeneratedScheduleDates(
  control: Control<LessonScheduleFormValues>,
): GeneratedScheduleDate[] {
  const [
    scheduleMode,
    recurringStartDate,
    startTime,
    repeatType,
    daysOfWeekRaw,
    endCondition,
    endDate,
    endCount,
    skipHolidays,
  ] = useWatch({
    control,
    name: [
      'schedule_mode',
      'start_date',
      'start_time',
      'repeat_type',
      'days_of_week',
      'end_condition',
      'end_date',
      'end_count',
      'skip_holidays',
    ],
  });

  return useMemo(() => {
    if (scheduleMode !== 'recurring') return [];
    const sd = recurringStartDate;
    if (!sd) return [];
    const days = daysOfWeekRaw ?? [];
    if (days.length === 0 && repeatType !== 'monthly') return [];

    const results: GeneratedScheduleDate[] = [];
    const start = new Date(sd + 'T00:00:00');

    let endDt: Date;
    let maxCount = Infinity;
    if (endCondition === 'by_date') {
      endDt = endDate ? new Date(endDate + 'T00:00:00') : new Date('2099-12-31');
    } else if (endCondition === 'by_count') {
      endDt = new Date('2099-12-31');
      maxCount = endCount === undefined || endCount === null ? 12 : Number(endCount);
    } else {
      endDt = new Date(start);
      endDt.setMonth(endDt.getMonth() + 3);
    }

    const startWeekMonday = new Date(start);
    const startDow = start.getDay();
    startWeekMonday.setDate(start.getDate() - ((startDow + 6) % 7));

    const current = new Date(start);

    while (current <= endDt && results.length < maxCount && results.length < 200) {
      const dayOfWeek = current.getDay();
      const shouldInclude =
        repeatType === 'monthly' ? current.getDate() === start.getDate() : days.includes(dayOfWeek);

      if (shouldInclude) {
        if (repeatType === 'biweekly') {
          const diffMs = current.getTime() - startWeekMonday.getTime();
          const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
          if (diffWeeks % 2 !== 0) {
            current.setDate(current.getDate() + 1);
            continue;
          }
        }
        const isoDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const isHoliday = HOLIDAYS_MOCK.includes(isoDate);
        if (!(skipHolidays && isHoliday)) {
          results.push({
            isoDate,
            date: `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')}`,
            dow: DAY_OF_WEEK_LABELS[dayOfWeek],
            time: startTime || '--:--',
            conflict: isHoliday && !skipHolidays,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return results;
  }, [
    scheduleMode,
    repeatType,
    daysOfWeekRaw,
    endCondition,
    endDate,
    endCount,
    skipHolidays,
    startTime,
    recurringStartDate,
  ]);
}
