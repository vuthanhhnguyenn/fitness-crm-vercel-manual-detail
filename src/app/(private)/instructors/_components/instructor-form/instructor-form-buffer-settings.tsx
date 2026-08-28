'use client';

import { useFormContext } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { InstructorFormValues } from '../instructor-form.schema';

const LEAD_HOURS_OPTIONS = [0, 1, 2, 3, 6, 12, 24, 48, 72].map((hours) => ({
  value: String(hours),
  label: `${hours}時間`,
}));

const BUFFER_MINUTES_OPTIONS = [0, 15, 30, 45, 60].map((minutes) => ({
  value: String(minutes),
  label: `${minutes}分`,
}));

const LEAD_HOURS_ITEMS = toSelectItems(LEAD_HOURS_OPTIONS);
const BUFFER_MINUTES_ITEMS = toSelectItems(BUFFER_MINUTES_OPTIONS);

export function InstructorFormBufferSettings() {
  const form = useFormContext<InstructorFormValues>();

  return (
    <>
      <h2 className="mb-4 text-base font-bold">バッファ設定</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        セッション前後の予約不可時間と、予約受付の最短リードタイムを設定します。
      </p>
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="minBookingLeadHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">最短受付期間</FormLabel>
              <Select
                items={LEAD_HOURS_ITEMS}
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_HOURS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preBufferMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">前バッファ</FormLabel>
              <Select
                items={BUFFER_MINUTES_ITEMS}
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUFFER_MINUTES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postBufferMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">後バッファ</FormLabel>
              <Select
                items={BUFFER_MINUTES_ITEMS}
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUFFER_MINUTES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
