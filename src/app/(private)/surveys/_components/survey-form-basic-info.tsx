'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SURVEY_BRAND_LABELS, SURVEY_TRIGGER_LABELS } from '../_constants/constants';
import type { SurveyFormValues } from '../_schemas/survey-form.schema';

export function SurveyFormBasicInfoSection() {
  const form = useFormContext<SurveyFormValues>();
  const brandOptions = Object.entries(SURVEY_BRAND_LABELS) as [
    keyof typeof SURVEY_BRAND_LABELS,
    string,
  ][];
  const triggerOptions = Object.entries(SURVEY_TRIGGER_LABELS) as [
    keyof typeof SURVEY_TRIGGER_LABELS,
    string,
  ][];
  const surveyTypeOptions = [{ value: 'lifecycle', label: 'ライフサイクル' }] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    アンケート名<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 入会時アンケート" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ブランド<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select
                    key={`survey-brand-${field.value ?? 'empty'}`}
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ブランドを選択">
                          {field.value ? SURVEY_BRAND_LABELS[field.value] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brandOptions.map(([value, label]) => (
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
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  種別<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex items-center gap-6"
                  >
                    {surveyTypeOptions.map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem value={value} id={`survey-type-${value}`} />
                        <FormLabel
                          htmlFor={`survey-type-${value}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {label}
                        </FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trigger"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  発動トリガー<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`survey-trigger-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="発動トリガーを選択">
                        {field.value ? SURVEY_TRIGGER_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {triggerOptions.map(([value, label]) => (
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
        </div>
      </CardContent>
    </Card>
  );
}
