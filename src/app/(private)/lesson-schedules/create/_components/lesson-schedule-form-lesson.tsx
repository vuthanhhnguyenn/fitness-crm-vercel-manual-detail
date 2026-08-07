'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';

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
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getCrmLessonsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';

export function LessonScheduleFormLesson() {
  const form = useFormContext<LessonScheduleFormValues>();
  const lessonType = useWatch({ control: form.control, name: 'lesson_type' });
  const [open, setOpen] = useState(false);

  const { data: lessonsData } = useQuery({
    ...getCrmLessonsOptions({
      query: lessonType ? { lesson_type: lessonType } : undefined,
    }),
  });

  const lessonList = lessonsData?.lessons ?? [];

  return (
    <Card>
      <CardContent className="px-6">
        <h2 className="mb-4 text-base font-bold">レッスン内容</h2>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="lesson_id"
            render={({ field }) => {
              const selectedLesson = lessonList.find((l) => l.id === field.value);
              return (
                <FormItem>
                  <FormLabel>
                    レッスン <span className="text-destructive">*</span>
                  </FormLabel>
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
                      {selectedLesson ? (
                        <span>
                          {selectedLesson.name}
                          {selectedLesson.duration ? ` (${selectedLesson.duration}分)` : ''}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">レッスンを選択してください</span>
                      )}
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="レッスンを検索..." className="h-8" />
                        <CommandList>
                          <CommandEmpty>該当なし</CommandEmpty>
                          <CommandGroup>
                            {lessonList.map((lesson) => (
                              <CommandItem
                                key={lesson.id}
                                value={lesson.name}
                                onSelect={() => {
                                  field.onChange(lesson.id);
                                  setOpen(false);
                                }}
                              >
                                {lesson.name}
                                {lesson.duration ? ` (${lesson.duration}分)` : ''}
                                <Check
                                  className={cn(
                                    'ml-auto size-4',
                                    field.value === lesson.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
