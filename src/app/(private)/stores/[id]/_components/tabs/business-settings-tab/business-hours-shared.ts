import type { GetCrmStoresByIdBusinessHoursResponse } from '@/lib/api/types.gen';

export const DAY_LABELS: Record<string, string> = {
  mon: '月曜日',
  tue: '火曜日',
  wed: '水曜日',
  thu: '木曜日',
  fri: '金曜日',
  sat: '土曜日',
  sun: '日曜日',
  holiday: '祝日',
};

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'] as const;

export type BusinessHours = GetCrmStoresByIdBusinessHoursResponse['business_hours'];

export const MOCK_CLOSED_DATES = new Set(['2026-04-11']);

export const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toDisplayDate = (dateText: string) => dateText.replaceAll('-', '/');

export const buildMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

export const getDayKey = (date: Date): (typeof DAY_ORDER)[number] => {
  const map: Record<number, (typeof DAY_ORDER)[number]> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };
  return map[date.getDay()];
};
