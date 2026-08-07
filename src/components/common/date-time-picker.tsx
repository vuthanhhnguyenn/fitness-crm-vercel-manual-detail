'use client';

import { useState } from 'react';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';

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

import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function buildDate(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface DateTimePickerProps {
  /** Current value — `Date` object or `undefined` when nothing is selected */
  value?: Date;
  /** Called with a new `Date` whenever the date or time part changes */
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Highlights the trigger in destructive colour when true */
  hasError?: boolean;
  className?: string;
}

// ── DateTimePicker ────────────────────────────────────────────────────────────
export function DateTimePicker({
  value,
  onChange,
  placeholder = '日時を選択',
  disabled = false,
  hasError = false,
  className,
}: Readonly<DateTimePickerProps>) {
  const [open, setOpen] = useState(false);

  // Internal selected date (may differ from `value` while the popover is open)
  const [pickedDate, setPickedDate] = useState<Date | undefined>(value);

  // Keep internal state in sync when the prop value changes externally
  const hour = pickedDate ? pickedDate.getHours() : 0;
  const minute = pickedDate ? pickedDate.getMinutes() : 0;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      setPickedDate(undefined);
      onChange?.(undefined);
      return;
    }
    const next = buildDate(day, hour, minute);
    setPickedDate(next);
    onChange?.(next);
  };

  const handleHourChange = (h: string | null) => {
    const base = pickedDate ?? new Date();
    const next = buildDate(base, parseInt(h ?? '0'), minute);
    setPickedDate(next);
    onChange?.(next);
  };

  const handleMinuteChange = (m: string | null) => {
    const base = pickedDate ?? new Date();
    const next = buildDate(base, hour, parseInt(m ?? '0'));
    setPickedDate(next);
    onChange?.(next);
  };

  const displayLabel = pickedDate
    ? format(pickedDate, 'yyyy/MM/dd HH:mm', { locale: ja })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-between gap-2 text-left font-normal',
              !pickedDate && 'text-muted-foreground',
              hasError && 'border-destructive text-destructive! focus-visible:ring-destructive/20',
              className,
            )}
          />
        }
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="size-3.5 shrink-0" />
          {displayLabel}
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        {/* Calendar */}
        <Calendar
          mode="single"
          selected={pickedDate}
          onSelect={handleDaySelect}
          defaultMonth={pickedDate}
          captionLayout="dropdown"
        />

        {/* Time row */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground size-3.5 shrink-0" />
            <span className="text-muted-foreground text-xs">時刻</span>
            <div className="ml-auto flex items-center gap-1">
              {/* Hour */}
              <Select value={String(hour).padStart(2, '0')} onValueChange={handleHourChange}>
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground text-sm font-medium">:</span>

              {/* Minute */}
              <Select value={String(minute).padStart(2, '0')} onValueChange={handleMinuteChange}>
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
