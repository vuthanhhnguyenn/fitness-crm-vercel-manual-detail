'use client';

import { useState } from 'react';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

const MONTHS_JA = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

function toYearMonth(value: string): { year: number; month: number } | null {
  const m = /^(\d{4})\/(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: parseInt(m[1]), month: parseInt(m[2]) };
}

function formatYearMonth(year: number, month: number): string {
  return `${year}/${String(month).padStart(2, '0')}`;
}

function formatDisplay(value: string): string {
  const parsed = toYearMonth(value);
  if (!parsed) return '';
  return format(new Date(parsed.year, parsed.month - 1, 1), 'yyyy年M月', { locale: ja });
}

interface MonthPickerProps {
  value: string; // YYYY/MM
  onChange: (v: string) => void;
  min?: string; // YYYY/MM — months before this are disabled
  placeholder?: string;
  hasError?: boolean;
}

export function MonthPicker({
  value,
  onChange,
  min,
  placeholder = '年月を選択',
  hasError,
}: Readonly<MonthPickerProps>) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = toYearMonth(value);
    return parsed?.year ?? now.getFullYear();
  });

  function isDisabled(year: number, month: number): boolean {
    if (!min) return false;
    return formatYearMonth(year, month) < min;
  }

  function handleSelect(month: number) {
    const newValue = formatYearMonth(viewYear, month);
    if (!isDisabled(viewYear, month)) {
      onChange(newValue);
      setOpen(false);
    }
  }

  const selected = toYearMonth(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              'w-44 justify-between gap-2 font-normal',
              !value && 'text-muted-foreground',
              hasError && 'border-destructive focus-visible:ring-destructive/20',
            )}
          />
        }
      >
        {value ? formatDisplay(value) : placeholder}
        <CalendarIcon className="size-3.5 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {/* Year navigation */}
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold">{viewYear}年</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTHS_JA.map((label, idx) => {
            const month = idx + 1;
            const disabled = isDisabled(viewYear, month);
            const isSelected = selected?.year === viewYear && selected?.month === month;
            return (
              <button
                key={month}
                onClick={() => handleSelect(month)}
                disabled={disabled}
                className={cn(
                  'rounded-md py-1.5 text-sm transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  disabled && 'text-muted-foreground pointer-events-none opacity-40',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
