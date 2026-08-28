'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Matcher } from 'react-day-picker';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  disabled?:  boolean;
  disabledDate?:  Matcher | Matcher[] | undefined;
  placeholder?: string;
  hasError?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  disabled = false,
  disabledDate,
  placeholder = '日付を選択',
  hasError = false,
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (nextDate: Date | undefined) => {
      onDateChange?.(nextDate);
      setOpen(false);
    },
    [onDateChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            // aria-invalid lets useScrollToFirstError locate the field while it has an error
            aria-invalid={hasError || undefined}
            className={cn(
              'justify-between gap-2 text-left font-normal',
              !date && 'text-muted-foreground',
              hasError && 'border-destructive text-destructive! focus-visible:ring-destructive/20',
            )}
            disabled={disabled}
          />
        }
      >
        {date ? format(date, 'yyyy/MM/dd', { locale: ja }) : placeholder}
        <CalendarIcon className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabledDate}
          defaultMonth={date}
          captionLayout="dropdown"
          locale={ja}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
