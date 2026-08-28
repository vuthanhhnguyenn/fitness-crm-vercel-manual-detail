'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Info, Lock, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  getCrmInstructorsOptions,
  getCrmLessonSchedulesInstructorAvailabilityOptions,
  getCrmStoresOptions,
  getCrmStudiosOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

import { useGeneratedScheduleDates } from '../_hooks/use-generated-schedule-dates.hook';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';
import { findStoreByLessonScheduleStoreId } from '../_utils/lesson-schedule-store.util';
import { InstructorAvatar } from './instructor-avatar';
import { InstructorConflictWarning } from './instructor-conflict-warning';

interface ConflictItem {
  instructorValue: string;
  date: string;
  lessonName: string;
}

/** Bounds how many recurring occurrences are checked for instructor conflicts (mock backend, cheap per-call). */
const MAX_CONFLICT_CHECK_OCCURRENCES = 30;

export function LessonScheduleFormInstructors() {
  const form = useFormContext<LessonScheduleFormValues>();

  const [
    lessonType,
    storeId,
    studioId,
    capacity,
    selectedInstructorIdsRaw,
    scheduleDate,
    scheduleStartDate,
    startTime,
  ] = useWatch({
    control: form.control,
    name: [
      'lesson_type',
      'store_id',
      'studio_id',
      'capacity',
      'instructor_ids',
      'date',
      'start_date',
      'start_time',
    ],
  });
  const selectedInstructorIds = useMemo(
    () => selectedInstructorIdsRaw ?? [],
    [selectedInstructorIdsRaw],
  );

  // D-01 権限マトリクス: Trainer は自分担当のみ。本人を固定し read-only にする（FR-003-014a）。
  // 認証ユーザーの id と instructor_id が一致する指導者を「本人」とみなす。
  const { user } = useAuthUser();
  const isTrainer = user?.role === UserRole.Trainer;
  const selfInstructorId = user?.id ?? '';

  const [open, setOpen] = useState(false);

  const { data: instructorsData } = useQuery({
    ...getCrmInstructorsOptions({
      query: {
        ...(storeId ? { store_id: storeId } : {}),
        status: 'active',
        tab: lessonType === 'personal' ? 'pt' : 'studio',
      },
    }),
  });

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });
  const stores = useMemo(() => storesRes?.stores ?? [], [storesRes?.stores]);
  const selectedStore = findStoreByLessonScheduleStoreId(stores, storeId ?? '');

  const { data: studiosData } = useQuery({
    ...getCrmStudiosOptions({
      query: selectedStore ? { store_id: selectedStore.id } : undefined,
    }),
    enabled: lessonType === 'studio' && !!selectedStore,
  });

  const generatedDates = useGeneratedScheduleDates(form.control);

  const checkDates = useMemo(() => {
    if (scheduleDate) return [scheduleDate];
    if (scheduleStartDate) {
      return generatedDates.slice(0, MAX_CONFLICT_CHECK_OCCURRENCES).map((d) => d.isoDate);
    }
    return [];
  }, [scheduleDate, scheduleStartDate, generatedDates]);

  const conflictCheckPairs = useMemo(
    () =>
      (selectedInstructorIds as string[]).flatMap((instructorId) =>
        checkDates.map((date) => ({ instructorId, date })),
      ),
    [selectedInstructorIds, checkDates],
  );

  const conflictQueries = useQueries({
    queries: conflictCheckPairs.map(({ instructorId, date }) => ({
      ...getCrmLessonSchedulesInstructorAvailabilityOptions({
        query: {
          instructor_id: instructorId,
          date,
          start_time: startTime!,
        },
      }),
      enabled: !!date && !!startTime,
    })),
  });

  const allConflicts = useMemo(() => {
    const conflicts: ConflictItem[] = [];
    const seen = new Set<string>();

    conflictQueries.forEach((query, index) => {
      const data = query.data;
      const { instructorId, date } = conflictCheckPairs[index];
      if (!data || data.available || data.conflicts.length === 0) return;

      const instructor = (instructorsData?.instructors ?? []).find(
        (i) => i.instructor_id === instructorId,
      );

      data.conflicts.forEach((conflict) => {
        const dedupeKey = `${instructorId}-${date}-${conflict.schedule_id}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        conflicts.push({
          instructorValue: instructor?.instructor_name ?? instructorId,
          date,
          lessonName: conflict.lesson_name,
        });
      });
    });

    return conflicts;
  }, [conflictCheckPairs, conflictQueries, instructorsData?.instructors]);

  const instructorList = instructorsData?.instructors ?? [];
  const selectedStudio = (studiosData?.items ?? []).find((s) => s.id === studioId);
  const effectiveMaxCapacity = selectedStudio
    ? selectedStudio.capacity + selectedStudio.buffer_value
    : undefined;

  const selectedInstructors = instructorList.filter((inst) =>
    (selectedInstructorIds as string[]).includes(inst.instructor_id),
  );

  // Trainer ログイン時は本人を自動セットして固定する（追加・削除不可）。
  useEffect(() => {
    if (!isTrainer || !selfInstructorId) return;
    const current = selectedInstructorIds as string[];
    if (current.length === 1 && current[0] === selfInstructorId) return;
    form.setValue('instructor_ids', [selfInstructorId], {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [isTrainer, selfInstructorId, selectedInstructorIds, form]);

  const selfInstructor = instructorList.find((inst) => inst.instructor_id === selfInstructorId);
  const selfInstructorName = selfInstructor?.instructor_name ?? user?.name ?? '';

  function handleAdd(instructorId: string) {
    if (!instructorId || (selectedInstructorIds as string[]).includes(instructorId)) return;
    form.setValue('instructor_ids', [...(selectedInstructorIds as string[]), instructorId], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleRemove(instructorId: string) {
    form.setValue(
      'instructor_ids',
      (selectedInstructorIds as string[]).filter((id) => id !== instructorId),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function handleToggle(instructorId: string) {
    if ((selectedInstructorIds as string[]).includes(instructorId)) {
      handleRemove(instructorId);
    } else {
      handleAdd(instructorId);
    }
  }

  const expectedRole = lessonType === 'personal' ? 'トレーナー' : 'インストラクター';
  return (
    <Card>
      <CardContent className="px-6">
        <h2 className="mb-4 text-base font-bold">インストラクター・定員</h2>
        <div className="space-y-4">
          {/* インストラクター選択 */}
          <FormField
            control={form.control}
            name="instructor_ids"
            render={() => (
              <FormItem>
                <FormLabel>
                  インストラクター <span className="text-destructive">*</span>
                </FormLabel>
                {isTrainer ? (
                  // FR-003-014a: Trainer は本人固定（read-only）。追加コンボボックス・削除ボタンなし。
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="flex h-7 items-center gap-2 pr-2 pl-1 text-xs font-normal"
                      >
                        <InstructorAvatar
                          photoUrl={selfInstructor?.photo_url}
                          name={selfInstructorName}
                          className="size-5"
                          iconClassName="size-3"
                        />
                        {selfInstructorName}
                        <span className="text-muted-foreground text-[10px]">（あなた）</span>
                        <Lock className="text-muted-foreground ml-0.5 size-3" />
                      </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Info className="size-3" />
                      ご自身が担当するスケジュールのみ登録できます。担当インストラクターはご自身に固定されます。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="h-8 w-full justify-between text-sm font-normal"
                          />
                        }
                      >
                        <span className="text-muted-foreground">
                          {(selectedInstructorIds as string[]).length === 0
                            ? '選択してください'
                            : '追加する...'}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder={`${expectedRole}を検索...`} className="h-8" />
                          <CommandList>
                            <CommandEmpty>該当なし</CommandEmpty>
                            <CommandGroup heading={`${expectedRole}（${instructorList.length}名）`}>
                              {instructorList.map((inst) => {
                                const isSelected = (selectedInstructorIds as string[]).includes(
                                  inst.instructor_id,
                                );
                                return (
                                  <CommandItem
                                    key={inst.instructor_id}
                                    value={inst.instructor_name}
                                    onSelect={() => {
                                      handleToggle(inst.instructor_id);
                                      setOpen(false);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <InstructorAvatar
                                      photoUrl={inst.photo_url}
                                      name={inst.instructor_name}
                                      className="size-6"
                                      iconClassName="size-3"
                                    />
                                    <span>{inst.instructor_name}</span>
                                    <Check
                                      className={cn(
                                        'ml-auto size-4',
                                        isSelected ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* 選択済みチップ */}
                    {selectedInstructors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedInstructors.map((inst) => (
                          <Badge
                            key={inst.instructor_id}
                            variant="secondary"
                            className="flex h-7 items-center gap-2 pr-1 pl-1 text-xs font-normal"
                          >
                            <InstructorAvatar
                              photoUrl={inst.photo_url}
                              name={inst.instructor_name}
                              className="size-5"
                              iconClassName="size-3"
                            />
                            {inst.instructor_name}
                            <button
                              type="button"
                              onClick={() => handleRemove(inst.instructor_id)}
                              className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                              aria-label={`${inst.instructor_name}を削除`}
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <FormMessage />

                {allConflicts.length > 0 && <InstructorConflictWarning conflicts={allConflicts} />}
              </FormItem>
            )}
          />

          {/* 定員（スタジオレッスンのみ） */}
          {lessonType === 'studio' && (
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    定員 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        className="h-8 w-[120px] text-sm"
                        placeholder="例: 10"
                        min={1}
                        max={effectiveMaxCapacity}
                        value={String(field.value ?? '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                      <Label className="text-muted-foreground text-sm">名</Label>
                      {selectedStudio && (
                        <Label className="text-muted-foreground text-xs">
                          （上限: {effectiveMaxCapacity}名 ／ 物理定員 {selectedStudio.capacity}名 +
                          バッファ {selectedStudio.buffer_value}名）
                        </Label>
                      )}
                    </div>
                  </FormControl>
                  {!studioId ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      スタジオを選択すると定員の上限（物理定員＋バッファ）が表示されます
                    </p>
                  ) : null}
                  {selectedStudio &&
                  capacity !== undefined &&
                  Number(capacity) > effectiveMaxCapacity! ? (
                    <p className="text-destructive text-xs">
                      定員が物理定員＋バッファ値（{effectiveMaxCapacity}
                      名）を超えているため登録できません
                    </p>
                  ) : null}
                  {selectedStudio &&
                  capacity !== undefined &&
                  Number(capacity) > selectedStudio.capacity &&
                  Number(capacity) <= effectiveMaxCapacity! ? (
                    <p className="text-warning text-xs">
                      定員がスタジオの物理定員を超えています。見学・体験枠を含む場合はこのまま進められます
                    </p>
                  ) : null}
                  {selectedStudio &&
                  capacity !== undefined &&
                  Number(capacity) > 0 &&
                  Number(capacity) <= selectedStudio.capacity ? (
                    <p className="text-muted-foreground text-xs">
                      例: {selectedStudio.capacity}名のスタジオで
                      {Number(capacity)}
                      名限定開催
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
