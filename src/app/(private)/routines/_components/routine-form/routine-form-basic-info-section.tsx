'use client';

import { useFormContext } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';

import { RequiredMark } from '@/components/common/field-marker';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { getCrmRoutineCategoriesOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { RoutineFormValues } from '../../_schemas/routine-form.schema';

export function RoutineFormBasicInfoSection() {
  const form = useFormContext<RoutineFormValues>();
  const { data: categoriesData } = useQuery({ ...getCrmRoutineCategoriesOptions() });
  const categories = categoriesData?.items ?? [];

  return (
    <Card>
      <CardContent className="px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
            1
          </div>
          <h3 className="text-sm font-bold">基本情報</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="routineCode"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>ルーティンコード</FormLabel>
                <div className="flex h-8 items-center gap-2">
                  <span className="text-muted-foreground font-mono text-sm">{field.value}</span>
                  <span className="text-muted-foreground text-xs">（手動編集不可）</span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>
                  ルーティン名
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ルーティン名を入力"
                    className="h-8"
                    maxLength={TEXT_MAX_LENGTH}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>説明文</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[72px] text-sm leading-relaxed"
                    placeholder="ルーティンの概要・目的・対象者などを記入してください"
                    maxLength={TEXTAREA_MAX_LENGTH}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ルーティンカテゴリ
                  <RequiredMark />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {field.value
                          ? (categories.find((category) => category.id === field.value)?.name ??
                            field.value)
                          : '選択してください'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
