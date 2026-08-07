'use client';

import { useState } from 'react';
import { ja } from 'react-day-picker/locale';

import { formatISODateLocal } from '@/utils/date.util';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useLessonScheduleFiltersContext } from '../_contexts/lesson-schedule-filters-context';

interface ToolbarStore {
  id: string;
  name: string;
}

interface ToolbarInstructor {
  id: string;
  name: string;
}

interface LessonScheduleToolbarProps {
  stores?: ToolbarStore[];
  instructors?: ToolbarInstructor[];
  studios?: string[];
  isTrainer?: boolean;
}

export function LessonScheduleToolbar({
  stores = [],
  instructors = [],
  studios = [],
  isTrainer = false,
}: LessonScheduleToolbarProps) {
  const { filters, setFilters, goToPrev, goToNext, goToToday } = useLessonScheduleFiltersContext();

  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentDate =
    filters.view === 'week' ? new Date(filters.week_start) : new Date(filters.date);

  function formatDisplayDate(): string {
    if (filters.view === 'week') {
      const start = new Date(filters.week_start);
      const end = new Date(filters.week_start);
      end.setDate(end.getDate() + 6);
      const sm = start.getFullYear();
      const startM = start.getMonth() + 1;
      const startD = start.getDate();
      const endM = end.getMonth() + 1;
      const endD = end.getDate();
      return startM === endM
        ? `${sm}年${startM}月${startD}日 〜 ${endD}日`
        : `${sm}年${startM}月${startD}日 〜 ${endM}月${endD}日`;
    }
    const d = new Date(filters.date);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${dayNames[d.getDay()]})`;
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (!date) return;
    if (filters.view === 'week') {
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date.getTime() + mondayOffset * 86400000);
      setFilters({ week_start: formatISODateLocal(monday) });
    } else {
      setFilters({ date: formatISODateLocal(date) });
    }
    setCalendarOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Date navigation */}
      <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToToday}>
        今日
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="size-8 p-0"
        onClick={goToPrev}
        aria-label="前へ"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border px-3 text-xs">
          <CalendarIcon className="size-3 shrink-0" />
          {formatDisplayDate()}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleCalendarSelect}
            locale={ja}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="sm"
        className="size-8 p-0"
        onClick={goToNext}
        aria-label="次へ"
      >
        <ChevronRight className="size-4" />
      </Button>

      {/* Filters (right-aligned) */}
      <div className="ml-auto flex items-center gap-2">
        {stores.length > 0 && (
          <Select
            value={filters.store_id ?? 'all'}
            onValueChange={(v) => setFilters({ store_id: v === 'all' ? null : v })}
            disabled={isTrainer}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue>
                {filters.store_id
                  ? `店舗: ${stores.find((s) => s.id === filters.store_id)?.name ?? filters.store_id}`
                  : '店舗: すべて'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">店舗: すべて</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {studios.length > 0 && (
          <Select
            value={filters.studio_name ?? 'all'}
            onValueChange={(v) => setFilters({ studio_name: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue>
                {filters.studio_name ? `スタジオ: ${filters.studio_name}` : 'スタジオ: すべて'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">スタジオ: すべて</SelectItem>
              {studios.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {instructors.length > 0 && !isTrainer && (
          <Select
            value={filters.instructor_id ?? 'all'}
            onValueChange={(v) => setFilters({ instructor_id: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue>
                {filters.instructor_id
                  ? `担当: ${instructors.find((i) => i.id === filters.instructor_id)?.name ?? filters.instructor_id}`
                  : '担当: すべて'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">担当: すべて</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Tabs
          value={filters.view}
          onValueChange={(v) => setFilters({ view: v as 'day' | 'week' | 'list' })}
        >
          <TabsList>
            <TabsTrigger value="day" className="text-xs">
              日
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              週間
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs">
              リスト
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
