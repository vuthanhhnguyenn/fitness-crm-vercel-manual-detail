'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { TRIAL_CAPACITY_OPTIONS } from '../_constants/constants';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';

export function LessonScheduleFormPublication() {
  const form = useFormContext<LessonScheduleFormValues>();

  const [lessonType, trialEnabled, trialMode, capacity, trialCapacity] = useWatch({
    control: form.control,
    name: ['lesson_type', 'trial_enabled', 'trial_mode', 'capacity', 'trial_capacity'],
  });

  return (
    <Card>
      <CardContent className="px-6">
        <h2 className="mb-4 text-base font-bold">公開設定</h2>
        <div className="space-y-4">
          {/* 公開設定 Switch */}
          <div className="bg-muted/30 rounded-lg border p-3">
            <Label className="mb-2 block text-sm font-medium">公開設定</Label>
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          field.value ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        {field.value ? '公開（モードA）' : '非公開（モードB）'}
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {field.value
                          ? '会員アプリから予約可能な枠として公開されます'
                          : 'CRM上のみで管理。指導者が手動で予約を入力します'}
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 体験枠設定（スタジオレッスンのみ） */}
          {lessonType === 'studio' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">体験枠設定</Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    新規入会検討者が体験予約できる枠を用意します
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="trial_enabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {trialEnabled && (
                <div className="space-y-3 pt-2 pl-1">
                  <div>
                    <Label className="text-muted-foreground mb-2 block text-xs font-medium">
                      受け入れモード
                    </Label>
                    <FormField
                      control={form.control}
                      name="trial_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup value={field.value ?? ''} onValueChange={field.onChange}>
                              <div className="grid grid-cols-2 gap-2">
                                <label
                                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${
                                    field.value === 'inclusive'
                                      ? 'border-primary bg-primary/5'
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <RadioGroupItem value="inclusive" className="mt-1" />
                                  <div>
                                    <p className="text-sm font-medium">内数</p>
                                    <p className="text-muted-foreground text-[10px]">
                                      定員内に体験枠を含める
                                    </p>
                                  </div>
                                </label>
                                <label
                                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${
                                    field.value === 'additional'
                                      ? 'border-primary bg-primary/5'
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <RadioGroupItem value="additional" className="mt-1" />
                                  <div>
                                    <p className="text-sm font-medium">外数</p>
                                    <p className="text-muted-foreground text-[10px]">
                                      定員に加えて体験枠を追加
                                    </p>
                                  </div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="text-muted-foreground mb-1 block text-xs font-medium">
                      体験受け入れ上限
                    </Label>
                    <FormField
                      control={form.control}
                      name="trial_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value?.toString() ?? '2'}
                            items={TRIAL_CAPACITY_OPTIONS}
                            onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRIAL_CAPACITY_OPTIONS.map(({ value, label }) => (
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
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {(() => {
                        const trialCap = Number(trialCapacity ?? 2);
                        const cap = Number(capacity ?? 0);
                        return trialMode === 'inclusive'
                          ? `定員${cap}名のうち最大${trialCap}名を体験者として受け入れ`
                          : `定員${cap}名 + 体験最大${trialCap}名（合計${cap + trialCap}名）`;
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
