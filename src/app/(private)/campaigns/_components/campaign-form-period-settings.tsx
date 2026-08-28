'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import { CAMPAIGN_APPLY_START_MONTH_LABELS } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';

const DATE_FORMAT = 'yyyy-MM-dd';

function toDate(value: string): Date | undefined {
  return value ? parse(value, DATE_FORMAT, new Date(), { locale: ja }) : undefined;
}

function SectionHeading({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

type DateFieldName = 'recruitmentStart' | 'recruitmentEnd' | 'usageStart' | 'usageEnd';

function DateField({ name, label }: Readonly<{ name: DateFieldName; label: string }>) {
  const form = useFormContext<CampaignFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <CampaignFieldLabel required>{label}</CampaignFieldLabel>
          <FormControl>
            <DatePicker
              date={toDate(field.value)}
              onDateChange={(date) => field.onChange(date ? format(date, DATE_FORMAT) : '')}
              placeholder={label}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CampaignFormPeriodSettings() {
  const form = useFormContext<CampaignFormValues>();
  const applyStartMonth = useWatch({ control: form.control, name: 'applyStartMonth' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">期間設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <SectionHeading title="募集期間" description="キャンペーンがモバイルに表示される期間" />
            <div className="grid grid-cols-2 gap-6">
              <DateField name="recruitmentStart" label="開始日" />
              <DateField name="recruitmentEnd" label="終了日" />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <SectionHeading
              title="利用開始期間"
              description="各種契約の利用開始日として指定可能な期間"
            />
            <div className="grid grid-cols-2 gap-6">
              <DateField name="usageStart" label="開始日" />
              <DateField name="usageEnd" label="終了日" />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <SectionHeading
              title="キャンペーン適用期間"
              description="割引等が適用される期間（利用開始日起算）"
            />

            <FormField
              control={form.control}
              name="applyStartMonth"
              render={({ field }) => (
                <FormItem>
                  <CampaignFieldLabel required>適用開始月</CampaignFieldLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-row gap-6"
                    >
                      {Object.entries(CAMPAIGN_APPLY_START_MONTH_LABELS).map(([value, label]) => (
                        <div key={value} className="flex items-center gap-2">
                          <RadioGroupItem value={value} id={`apply-${value}`} />
                          <Label
                            htmlFor={`apply-${value}`}
                            className="cursor-pointer text-sm font-normal"
                          >
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

            {applyStartMonth === 'specific_month' && (
              <FormField
                control={form.control}
                name="applyStartSpecificN"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="例: 3"
                          className="w-24"
                          {...field}
                        />
                      </FormControl>
                      <span className="text-muted-foreground text-sm">ヶ月目から</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="applyDurationMonths"
              render={({ field }) => (
                <FormItem>
                  <CampaignFieldLabel required>適用期間</CampaignFieldLabel>
                  <FormDescription>利用開始日起算</FormDescription>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="例: 3"
                        className="w-24"
                        {...field}
                      />
                    </FormControl>
                    <span className="text-muted-foreground text-sm">ヶ月</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
