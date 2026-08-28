'use client';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, ChevronDown, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmStoresByStoreIdHolidaysOptions,
  getCrmStoresOptions,
  getCrmStudiosOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  COURSE_TYPE_OPTIONS,
  DAY_OF_WEEK_LABELS,
  LESSON_TYPE_LABELS,
  REPEAT_TYPE_OPTIONS,
} from '../_constants/constants';
import { useGeneratedScheduleDates } from '../_hooks/use-generated-schedule-dates.hook';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';
import {
  findStoreByLessonScheduleStoreId,
  toLessonScheduleStoreId,
} from '../_utils/lesson-schedule-store.util';
import { HolidayWarningBanner } from './holiday-warning-banner';
import { LessonScheduleTemplatePopover } from './lesson-schedule-template-popover';

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

function strToDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const parts = s.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function dateToStr(d: Date | undefined): string {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ORDERED_DAYS: number[] = [1, 2, 3, 4, 5, 6, 0];

export function LessonScheduleFormDateStudio() {
  const form = useFormContext<LessonScheduleFormValues>();

  const [
    lessonType,
    scheduleMode,
    storeId,
    singleDate,
    recurringStartDate,
    repeatType,
    daysOfWeekRaw,
    endCondition,
    selectedStudioId,
  ] = useWatch({
    control: form.control,
    name: [
      'lesson_type',
      'schedule_mode',
      'store_id',
      'date',
      'start_date',
      'repeat_type',
      'days_of_week',
      'end_condition',
      'studio_id',
    ],
  });

  const startDate = scheduleMode === 'single' ? singleDate : recurringStartDate;
  const daysOfWeek = daysOfWeekRaw ?? [];

  const [visibleCount, setVisibleCount] = useState(20);

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });
  const stores = useMemo(() => storesRes?.stores ?? [], [storesRes?.stores]);

  const storeSelectItems = useMemo(
    () =>
      stores.map((store) => ({
        value: toLessonScheduleStoreId(store),
        label: store.name,
      })),
    [stores],
  );

  const selectedStore = findStoreByLessonScheduleStoreId(stores, storeId ?? '');

  const { data: studiosData, isFetching: isStudiosFetching } = useQuery({
    ...getCrmStudiosOptions({
      query: selectedStore ? { store_id: selectedStore.id } : undefined,
    }),
    enabled: lessonType === 'studio' && !!selectedStore,
  });

  const filteredStudios = useMemo(() => studiosData?.items ?? [], [studiosData?.items]);
  const selectedStudio = filteredStudios.find((s) => s.id === selectedStudioId);

  const studioSelectItems = useMemo(
    () =>
      filteredStudios.map((studio) => ({
        value: studio.id,
        label: `${studio.name}（物理定員 ${studio.capacity}名）`,
      })),
    [filteredStudios],
  );
  const { data: holidaysRes } = useQuery({
    ...getCrmStoresByStoreIdHolidaysOptions({
      path: { storeId: storeId! },
      query: { from: startDate!, to: startDate! },
    }),
    enabled: scheduleMode === 'single' && !!storeId && !!startDate,
  });

  const holidayDates = (holidaysRes?.holidays ?? []).map((h) => h.date);
  const isSingleDateHoliday =
    scheduleMode === 'single' &&
    !!startDate &&
    (holidayDates.includes(startDate) || HOLIDAYS_MOCK.includes(startDate));

  const selectedStoreName = selectedStore?.name ?? storeId;

  function handleStoreChange(value: string | null) {
    if (!value) return;
    form.setValue('store_id', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('studio_id', '', { shouldDirty: true, shouldValidate: true });
  }

  function handleStudioChange(value: string | null) {
    if (!value) return;
    form.setValue('studio_id', value, { shouldDirty: true, shouldValidate: true });
    const studio = filteredStudios.find((s) => s.id === value);
    if (studio) {
      form.setValue('capacity', studio.capacity, { shouldDirty: true, shouldValidate: true });
    }
  }

  const generatedDates = useGeneratedScheduleDates(form.control);

  const totalCount = generatedDates.length;
  const firstDate = generatedDates[0]?.date ?? '';
  const lastDate = generatedDates[generatedDates.length - 1]?.date ?? '';
  const conflictCount = generatedDates.filter((d) => d.conflict).length;

  const previewEmptyMessage = !recurringStartDate
    ? '開始日を選択すると予定日が表示されます'
    : daysOfWeek.length === 0
      ? '曜日を選択すると予定日が表示されます'
      : null;

  return (
    <Card>
      <CardContent className="px-6">
        <h2 className="mb-4 text-base font-bold">日時・スタジオ</h2>
        <div className="space-y-4">
          {/* レッスン区分 (Radio) */}
          <FormField
            control={form.control}
            name="lesson_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  レッスン区分 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-6"
                  >
                    {Object.entries(LESSON_TYPE_LABELS).map(([value, label]) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem value={value} id={`lesson-type-${value}`} />
                        <Label htmlFor={`lesson-type-${value}`} className="cursor-pointer text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* コース種別 (PT only) */}
          {lessonType === 'personal' && (
            <FormField
              control={form.control}
              name="course_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    コース種別 <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value ?? ''}
                    items={COURSE_TYPE_OPTIONS}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 w-[200px] text-sm">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COURSE_TYPE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 店舗 */}
          <FormField
            control={form.control}
            name="store_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  店舗 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  items={storeSelectItems}
                  onValueChange={handleStoreChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="店舗を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storeSelectItems.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* スタジオ (studio only) */}
          {lessonType === 'studio' && (
            <FormField
              control={form.control}
              name="studio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    スタジオ <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    items={studioSelectItems}
                    onValueChange={handleStudioChange}
                    disabled={!storeId || isStudiosFetching}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studioSelectItems.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudio && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Info className="size-3" />
                      物理定員: {selectedStudio.capacity}
                      名（このスタジオの最大収容人数）
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* スケジュール種別 (Radio) */}
          <FormField
            control={form.control}
            name="schedule_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  スケジュール種別 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="single" id="mode-single" />
                      <Label htmlFor="mode-single" className="cursor-pointer text-sm">
                        単発
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="recurring" id="mode-recurring" />
                      <Label htmlFor="mode-recurring" className="cursor-pointer text-sm">
                        繰り返し
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 実施日 / 開始日 + 開始時刻 */}
          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name={scheduleMode === 'single' ? 'date' : 'start_date'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {scheduleMode === 'single' ? '実施日' : '開始日'}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={strToDate(field.value)}
                      onDateChange={(d) => field.onChange(dateToStr(d))}
                      placeholder="日付を選択"
                      hasError={
                        !!form.formState.errors[scheduleMode === 'single' ? 'date' : 'start_date']
                      }
                    />
                  </FormControl>
                  {isSingleDateHoliday && (
                    <HolidayWarningBanner storeName={selectedStoreName} date={field.value ?? ''} />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    開始時間 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="time" className="h-8 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 繰り返し詳細 */}
          {scheduleMode === 'recurring' && (
            <div className="border-border/50 bg-muted/50 space-y-4 rounded-lg border p-4">
              {/* 繰り返しパターン + テンプレートPopover */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">繰り返しパターン</Label>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="repeat_type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          value={field.value ?? ''}
                          items={REPEAT_TYPE_OPTIONS}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background h-8 text-sm">
                              <SelectValue placeholder="繰り返し種別を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPEAT_TYPE_OPTIONS.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <LessonScheduleTemplatePopover />
                </div>
              </div>

              {/* 曜日選択 */}
              {(repeatType === 'weekly' || repeatType === 'biweekly') && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">曜日</Label>
                  <div className="flex items-center gap-2">
                    {ORDERED_DAYS.map((day) => {
                      const isSelected = daysOfWeek.includes(day);
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className={`size-9 rounded-lg p-0 text-sm font-medium ${
                            !isSelected
                              ? 'text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              : ''
                          }`}
                          onClick={() => {
                            const current = form.getValues('days_of_week') ?? [];
                            form.setValue(
                              'days_of_week',
                              current.includes(day)
                                ? current.filter((d) => d !== day)
                                : [...current, day],
                              { shouldDirty: true, shouldValidate: true },
                            );
                          }}
                        >
                          {DAY_OF_WEEK_LABELS[day]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 終了条件 */}
              <div>
                <Label className="mb-2 block text-sm font-medium">終了条件</Label>
                <FormField
                  control={form.control}
                  name="end_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="by_date" id="end-by-date" />
                            <Label
                              htmlFor="end-by-date"
                              className="text-muted-foreground cursor-pointer text-sm"
                            >
                              指定日まで
                            </Label>
                            {endCondition === 'by_date' && (
                              <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field: dateField }) => (
                                  <DatePicker
                                    date={strToDate(dateField.value)}
                                    onDateChange={(d) => dateField.onChange(dateToStr(d))}
                                    placeholder="日付を選択"
                                  />
                                )}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="by_count" id="end-by-count" />
                            <Label
                              htmlFor="end-by-count"
                              className="text-muted-foreground cursor-pointer text-sm"
                            >
                              回数指定
                            </Label>
                            {endCondition === 'by_count' && (
                              <>
                                <FormField
                                  control={form.control}
                                  name="end_count"
                                  render={({ field: countField }) => (
                                    <Input
                                      type="number"
                                      className="ml-2 h-8 w-20 text-sm"
                                      placeholder="12"
                                      value={String(countField.value ?? '')}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        countField.onChange(val === '' ? undefined : Number(val));
                                      }}
                                      onBlur={countField.onBlur}
                                    />
                                  )}
                                />
                                <span className="text-muted-foreground text-sm">回</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="indefinite" id="end-indefinite" />
                            <Label
                              htmlFor="end-indefinite"
                              className="text-muted-foreground cursor-pointer text-sm"
                            >
                              無期限
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 祝日スキップ */}
              <FormField
                control={form.control}
                name="skip_holidays"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="skip-holiday"
                      />
                    </FormControl>
                    <Label htmlFor="skip-holiday" className="cursor-pointer text-sm font-normal">
                      祝日はスキップする
                    </Label>
                  </FormItem>
                )}
              />

              {/* 実施予定日プレビュー */}
              <div className="border-border/60 space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">実施予定日</Label>
                <div className="border-border/60 bg-background overflow-hidden rounded-md border">
                  {totalCount === 0 ? (
                    <div className="text-muted-foreground flex min-h-[120px] items-center justify-center px-4 py-6 text-center text-xs">
                      {previewEmptyMessage ?? '条件を指定すると予定日が表示されます'}
                    </div>
                  ) : (
                    <>
                      <div className="border-border/60 bg-muted/30 flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-3">
                        <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                        <span className="text-sm font-medium tabular-nums">
                          {firstDate} 〜 {lastDate}
                        </span>
                        <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                          全 {totalCount} 回
                        </Badge>
                      </div>

                      {conflictCount > 0 && (
                        <div className="border-warning/20 bg-warning/15 flex items-start gap-2 border-b px-3 py-2">
                          <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
                          <p className="text-warning text-xs">
                            店舗休業日と重なる予定が {conflictCount}{' '}
                            件あります。そのまま登録すると登録後に個別修正が必要です
                          </p>
                        </div>
                      )}

                      {endCondition === 'indefinite' && (
                        <div className="border-info/20 bg-info/15 flex items-center gap-2 border-b px-3 py-2">
                          <Info className="text-info size-4 shrink-0" />
                          <p className="text-info text-xs">今後3ヶ月間のみ表示しています</p>
                        </div>
                      )}

                      <ul className="divide-border/60 max-h-[280px] divide-y overflow-y-auto">
                        {generatedDates.slice(0, visibleCount).map((d, idx) => (
                          <li
                            key={idx}
                            className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 px-3 py-2 text-xs"
                          >
                            <span className="text-foreground font-medium tabular-nums">
                              {d.date}
                            </span>
                            <Badge variant="outline" className="h-5 px-2 text-[10px] font-normal">
                              {d.dow}
                            </Badge>
                            <span className="text-muted-foreground tabular-nums">{d.time}</span>
                            {d.conflict ? (
                              <Badge
                                variant="outline"
                                className="border-warning/40 bg-warning/15 text-warning h-5 gap-1 px-2 text-[10px]"
                              >
                                <AlertTriangle className="size-3" />
                                休業日
                              </Badge>
                            ) : (
                              <span />
                            )}
                          </li>
                        ))}
                      </ul>

                      {generatedDates.length > visibleCount && (
                        <div className="border-border/60 border-t">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <span className="text-muted-foreground flex-1 text-xs tabular-nums">
                              他 {generatedDates.length - visibleCount} 件
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setVisibleCount((n) => n + 20)}
                            >
                              さらに表示 <ChevronDown className="ml-1 size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
