'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Info, Lock, UserRound, X } from 'lucide-react';

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
  getCrmStudiosOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';
import { InstructorConflictWarning } from './instructor-conflict-warning';

interface ConflictItem {
  instructorValue: string;
  date: string;
  lessonName: string;
}

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
      query: storeId ? { store_id: storeId } : undefined,
    }),
  });

  const { data: studiosData } = useQuery({
    ...getCrmStudiosOptions({
      query: storeId ? { store_id: storeId } : undefined,
    }),
    enabled: lessonType === 'studio',
  });

  const checkDate = scheduleDate || scheduleStartDate;

  const conflictQueries = useQueries({
    queries: (selectedInstructorIds as string[]).map((instructorId) => ({
      ...getCrmLessonSchedulesInstructorAvailabilityOptions({
        query: {
          instructor_id: instructorId,
          date: checkDate!,
          start_time: startTime!,
        },
      }),
      enabled: !!checkDate && !!startTime,
    })),
  });

  const allConflicts = useMemo(() => {
    const conflicts: ConflictItem[] = [];

    conflictQueries.forEach((query, index) => {
      const data = query.data;
      const instructorId = (selectedInstructorIds as string[])[index];
      if (!data || data.available || data.conflicts.length === 0) return;

      const instructor = (instructorsData?.instructors ?? []).find(
        (i) => i.instructor_id === instructorId,
      );

      data.conflicts.forEach((conflict) => {
        conflicts.push({
          instructorValue: instructor?.instructor_name ?? instructorId,
          date: checkDate!,
          lessonName: conflict.lesson_name,
        });
      });
    });

    return conflicts;
  }, [checkDate, conflictQueries, instructorsData?.instructors, selectedInstructorIds]);

  const instructorList = instructorsData?.instructors ?? [];
  const selectedStudio = (studiosData?.items ?? []).find((s) => s.id === studioId);

  const availableInstructors = instructorList.filter(
    (inst) => !(selectedInstructorIds as string[]).includes(inst.instructor_id),
  );
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
                        {selfInstructor?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selfInstructor.photo_url}
                            alt={selfInstructorName}
                            className="size-5 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full">
                            <UserRound className="text-muted-foreground size-3" />
                          </div>
                        )}
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
                            <CommandGroup
                              heading={`${expectedRole}（${availableInstructors.length}名）`}
                            >
                              {availableInstructors.map((inst) => (
                                <CommandItem
                                  key={inst.instructor_id}
                                  value={inst.instructor_name}
                                  onSelect={() => {
                                    handleAdd(inst.instructor_id);
                                    setOpen(false);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  {inst.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={inst.photo_url}
                                      alt={inst.instructor_name}
                                      className="size-6 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full">
                                      <UserRound className="text-muted-foreground size-3" />
                                    </div>
                                  )}
                                  <span>{inst.instructor_name}</span>
                                  <Check
                                    className={cn(
                                      'ml-auto size-4',
                                      (selectedInstructorIds as string[]).includes(
                                        inst.instructor_id,
                                      )
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
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
                            {inst.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inst.photo_url}
                                alt={inst.instructor_name}
                                className="size-5 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full">
                                <UserRound className="text-muted-foreground size-3" />
                              </div>
                            )}
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
                        max={selectedStudio?.capacity}
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
                          （上限: {selectedStudio.capacity}名 ／ {selectedStudio.name}
                          物理定員）
                        </Label>
                      )}
                    </div>
                  </FormControl>
                  {!studioId ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      スタジオを選択すると物理定員の上限が表示されます
                    </p>
                  ) : null}
                  {selectedStudio &&
                  capacity !== undefined &&
                  Number(capacity) > selectedStudio.capacity ? (
                    <p className="text-destructive text-xs">
                      物理定員（{selectedStudio.capacity}名）を超えています
                    </p>
                  ) : null}
                  {selectedStudio &&
                  capacity !== undefined &&
                  Number(capacity) > 0 &&
                  Number(capacity) <= selectedStudio.capacity ? (
                    <p className="text-muted-foreground text-xs">
                      例: {selectedStudio.capacity}名のスタジオで{Number(capacity)}
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
