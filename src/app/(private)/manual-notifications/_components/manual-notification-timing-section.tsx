'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { CalendarClock, Clock, RotateCcw } from 'lucide-react';

import { DateTimePicker } from '@/components/common/date-time-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  MANUAL_NOTIFICATION_FREQUENCY_LABELS,
  MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS,
} from '../_constants/manual-notification.constants';
import type { ManualNotificationFormValues } from '../_schemas/manual-notification-form.schema';

const TIMING_OPTIONS = [
  { value: 'immediate', label: '即時配信', icon: Clock },
  { value: 'scheduled', label: '予約配信', icon: CalendarClock },
  { value: 'recurring', label: '繰り返し配信', icon: RotateCcw },
] as const;
type TimingType = ManualNotificationFormValues['timing']['type'];

function createTiming(type: TimingType): ManualNotificationFormValues['timing'] {
  if (type === 'immediate') return { type };

  const startAt = new Date(Date.now() + 60 * 60 * 1000);
  if (type === 'scheduled') return { type, scheduledAt: startAt };

  return {
    type,
    frequency: 'weekly',
    startAt,
    endDate: undefined,
    maxOccurrences: undefined,
    endMode: 'none',
  };
}

export function ManualNotificationTimingSection() {
  const { control, setValue } = useFormContext<ManualNotificationFormValues>();
  const timing = useWatch({ control, name: 'timing' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">配信タイミング</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField
          control={control}
          name="timing.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                配信タイミング <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    if (!value) return;
                    setValue('timing', createTiming(value as TimingType), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  className="space-y-2"
                >
                  {TIMING_OPTIONS.map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem value={option.value} />
                      <option.icon className="text-muted-foreground size-3" />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {timing.type === 'scheduled' ? (
          <FormField
            control={control}
            name="timing.scheduledAt"
            render={({ field, fieldState }) => (
              <FormItem className="max-w-sm">
                <FormLabel>配信日時</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    hasError={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormDescription>現在時刻より後の日時を指定してください。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {timing.type === 'recurring' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name="timing.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>繰り返し頻度</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {MANUAL_NOTIFICATION_FREQUENCY_LABELS[field.value]}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">
                          {MANUAL_NOTIFICATION_FREQUENCY_LABELS.daily}
                        </SelectItem>
                        <SelectItem value="weekly">
                          {MANUAL_NOTIFICATION_FREQUENCY_LABELS.weekly}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {MANUAL_NOTIFICATION_FREQUENCY_LABELS.monthly}
                        </SelectItem>
                        <SelectItem value="custom">
                          {MANUAL_NOTIFICATION_FREQUENCY_LABELS.custom}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="timing.startAt"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>開始日時</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        hasError={Boolean(fieldState.error)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {timing.frequency === 'custom' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="timing.intervalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>間隔の数値</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === '' ? undefined : event.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="timing.intervalUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>間隔の単位</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="単位を選択">
                              {field.value
                                ? MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS[field.value]
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="day">
                            {MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS.day}
                          </SelectItem>
                          <SelectItem value="week">
                            {MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS.week}
                          </SelectItem>
                          <SelectItem value="month">
                            {MANUAL_NOTIFICATION_INTERVAL_UNIT_LABELS.month}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            <FormField
              control={control}
              name="timing.endMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>終了条件</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-wrap gap-4"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="none" />
                        終了日なし
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="date" />
                        指定日に終了
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="count" />
                        回数指定
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {timing.endMode === 'date' ? (
              <div className="max-w-sm">
                <FormField
                  control={control}
                  name="timing.endDate"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>終了日</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                          hasError={Boolean(fieldState.error)}
                          placeholder="終了日を選択"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {timing.endMode === 'count' ? (
              <div className="max-w-sm">
                <FormField
                  control={control}
                  name="timing.maxOccurrences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>配信回数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="例: 5"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === '' ? undefined : event.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
