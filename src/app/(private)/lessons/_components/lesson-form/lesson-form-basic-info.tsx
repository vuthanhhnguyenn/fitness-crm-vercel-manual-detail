'use client';

import { useFormContext, useWatch } from 'react-hook-form';

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

import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  studio: 'スタジオレッスン',
  personal: 'パーソナルトレーニング',
  bodycare: 'ボディケア',
};

const BRAND_LABELS: Record<string, string> = {
  joyfit: 'JOYFIT',
  fit365: 'FIT365',
};

const PRICING_TYPE_LABELS: Record<string, string> = {
  free: '無料',
  monthly: '有料（月払）',
  per_use: '有料（都次）',
};

const DURATION_OPTIONS: Record<string, number[]> = {
  personal: [30, 60],
  studio: [15, 30, 45, 50, 60, 90, 120],
  bodycare: [15, 30, 45, 50, 60, 90, 120],
};

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
    </div>
  );
}

export function LessonFormBasicInfo() {
  const form = useFormContext<LessonFormValues>();
  const lessonType = useWatch({ control: form.control, name: 'lessonType' });
  const pricingType = useWatch({ control: form.control, name: 'pricingType' });
  const durations = DURATION_OPTIONS[lessonType] ?? DURATION_OPTIONS.studio;

  return (
    <Card>
      <CardContent className="px-6">
        <SectionHeader number={1} title="基本情報" />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>
                  レッスン名
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input placeholder="レッスン名を入力" className="h-8" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lessonType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  レッスン区分
                  <RequiredMark />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue>
                        {field.value ? LESSON_TYPE_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="studio">スタジオレッスン</SelectItem>
                    <SelectItem value="personal">パーソナルトレーニング</SelectItem>
                    <SelectItem value="bodycare">ボディケア</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ブランド
                  <RequiredMark />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {field.value ? BRAND_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="joyfit">JOYFIT</SelectItem>
                    <SelectItem value="fit365">FIT365</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  所要時間
                  <RequiredMark />
                </FormLabel>
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {field.value ? `${field.value}分` : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}分
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
            name="pricingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  料金種別
                  <RequiredMark />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {field.value ? PRICING_TYPE_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">無料</SelectItem>
                    <SelectItem value="monthly">有料（月払）</SelectItem>
                    <SelectItem value="per_use">有料（都次）</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          {pricingType === 'per_use' && (
            <FormField
              control={form.control}
              name="perUseFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    都次利用料金（税込）
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8"
                        type="number"
                        placeholder="金額を入力"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                      <span className="text-muted-foreground shrink-0 text-xs">円</span>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
