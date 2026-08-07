'use client';

import { useMemo } from 'react';

import * as holidayJp from '@holiday-jp/holiday_jp';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BusinessHours } from './business-hours-shared';
import { MOCK_CLOSED_DATES, buildMonthDays, getDayKey, toInputDate } from './business-hours-shared';

type Props = {
  monthDate: Date;
  onMonthDateChange: (date: Date) => void;
  defaultHoursMap: Record<string, BusinessHours['default_hours'][number]>;
  exceptionMap: Set<string>;
  closureMap: Set<string>;
};

export function BusinessCalendar({
  monthDate,
  onMonthDateChange,
  defaultHoursMap,
  exceptionMap,
  closureMap,
}: Props) {
  const japaneseHolidayMap = useMemo(() => {
    const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const holidays = holidayJp.between(from, to);

    return holidays.reduce<Map<string, string>>((acc, holiday) => {
      acc.set(toInputDate(holiday.date), holiday.name);
      return acc;
    }, new Map<string, string>());
  }, [monthDate]);

  const monthDays = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const monthLabel = useMemo(
    () => `${monthDate.getFullYear()}年${String(monthDate.getMonth() + 1).padStart(2, '0')}月`,
    [monthDate],
  );

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">営業カレンダー</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onMonthDateChange(new Date())}>
              本日
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                onMonthDateChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                onMonthDateChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="text-sm font-medium">{monthLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div
              key={day}
              className="text-muted-foreground py-1 text-center text-[10px] font-medium"
            >
              {day}
            </div>
          ))}
          {monthDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} className="aspect-3/2" />;
            const dayKey = getDayKey(date);
            const dateText = toInputDate(date);
            const isClosure = closureMap.has(dateText);
            const isException = exceptionMap.has(dateText);
            const holidayName = japaneseHolidayMap.get(dateText);
            const isJapaneseHoliday = Boolean(holidayName);
            const isMockClosedDate = MOCK_CLOSED_DATES.has(dateText);
            const isClosedDefault = defaultHoursMap[dayKey]?.is_closed || isMockClosedDate;

            const toneClass = isClosure
              ? 'bg-sky-100 text-sky-700'
              : isException || isJapaneseHoliday
                ? 'bg-amber-100 text-amber-700'
                : isClosedDefault
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-emerald-100 text-emerald-700';

            return (
              <div key={dateText} className="flex aspect-3/2 items-center justify-center">
                <div
                  className={`flex size-8 items-center justify-center rounded-md text-xs font-medium ${toneClass}`}
                  title={holidayName}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="size-3 rounded-sm border border-emerald-200 bg-emerald-100" />
            <span className="text-muted-foreground text-[10px]">営業日</span> {/* workday */}
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="border-destructive/20 bg-destructive/15 size-3 rounded-sm border" />
            <span className="text-muted-foreground text-[10px]">定休日</span> {/* closed day */}
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="size-3 rounded-sm border border-sky-200 bg-sky-100" />
            <span className="text-muted-foreground text-[10px]">臨時休業</span>{' '}
            {/* temporary closure */}
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="size-3 rounded-sm border border-amber-200 bg-amber-100" />
            <span className="text-muted-foreground text-[10px]">祝日等</span> {/* holiday */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
