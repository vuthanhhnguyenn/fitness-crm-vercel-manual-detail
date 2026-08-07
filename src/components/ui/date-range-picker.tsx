"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { ja } from "date-fns/locale";

export type DateRangePickerProps = {
  date?: DateRange | undefined;
  onDateChange?: (date: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "期間を選択",
  className,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={className || "h-9 justify-start gap-2 px-3 font-normal"}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "yyyy年M月d日", { locale: ja })} -{" "}
              {format(date.to, "yyyy年M月d日", { locale: ja })}
            </>
          ) : (
            format(date.from, "yyyy年M月d日", { locale: ja })
          )
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onDateChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
