'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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
import { Separator } from '@/components/ui/separator';

import { CAMPAIGN_APPLICATION_START_MONTH_LABELS } from '../_constants/constants';
import {
  CAMPAIGN_APPLICATION_DURATION_OPTIONS,
  type CampaignFormValues,
} from '../_schemas/campaign-form.schema';
import { CampaignRequiredLabel } from './campaign-required-label';

function SectionHeading({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

export function CampaignFormPeriodSettings() {
  const form = useFormContext<CampaignFormValues>();
  const applicationStartMonthType = useWatch({
    control: form.control,
    name: 'application_start_month_type',
  });
  const recruitmentPeriodStart = useWatch({
    control: form.control,
    name: 'recruitment_period_start',
  });
  const recruitmentPeriodEnd = useWatch({
    control: form.control,
    name: 'recruitment_period_end',
  });
  const usagePeriodStart = useWatch({
    control: form.control,
    name: 'usage_period_start',
  });
  const usagePeriodEnd = useWatch({
    control: form.control,
    name: 'usage_period_end',
  });

  const recruitmentStartDate = recruitmentPeriodStart
    ? new Date(`${recruitmentPeriodStart}T00:00:00`)
    : undefined;
  const recruitmentEndDate = recruitmentPeriodEnd
    ? new Date(`${recruitmentPeriodEnd}T00:00:00`)
    : undefined;
  const usageStartDate = usagePeriodStart ? new Date(`${usagePeriodStart}T00:00:00`) : undefined;
  const usageEndDate = usagePeriodEnd ? new Date(`${usagePeriodEnd}T00:00:00`) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">期間設定</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <div className="flex flex-col gap-4">
          <SectionHeading title="募集期間" description="キャンペーンがモバイルに表示される期間" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="recruitment_period_start"
              render={({ field }) => (
                <FormItem>
                  <CampaignRequiredLabel>開始日</CampaignRequiredLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                      placeholder="日付を選択"
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabledDate={
                        recruitmentEndDate ? (date) => date > recruitmentEndDate : undefined
                      }
                      hasError={Boolean(form.formState.errors.recruitment_period_start)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recruitment_period_end"
              render={({ field }) => (
                <FormItem>
                  <CampaignRequiredLabel>終了日</CampaignRequiredLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                      placeholder="日付を選択"
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabledDate={
                        recruitmentStartDate ? (date) => date < recruitmentStartDate : undefined
                      }
                      hasError={Boolean(form.formState.errors.recruitment_period_end)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <SectionHeading
            title="利用開始期間"
            description="各種契約の利用開始日として指定可能な期間"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="usage_period_start"
              render={({ field }) => (
                <FormItem>
                  <CampaignRequiredLabel>開始日</CampaignRequiredLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                      placeholder="日付を選択"
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabledDate={usageEndDate ? (date) => date > usageEndDate : undefined}
                      hasError={Boolean(form.formState.errors.usage_period_start)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usage_period_end"
              render={({ field }) => (
                <FormItem>
                  <CampaignRequiredLabel>終了日</CampaignRequiredLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                      placeholder="日付を選択"
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabledDate={usageStartDate ? (date) => date < usageStartDate : undefined}
                      hasError={Boolean(form.formState.errors.usage_period_end)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            name="application_start_month_type"
            render={({ field }) => (
              <FormItem>
                <CampaignRequiredLabel>適用開始月</CampaignRequiredLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-3 md:flex-row md:gap-6"
                  >
                    {Object.entries(CAMPAIGN_APPLICATION_START_MONTH_LABELS).map(
                      ([value, label]) => (
                        <div key={value} className="flex items-center gap-2">
                          <RadioGroupItem value={value} id={`application-start-${value}`} />
                          <Label
                            htmlFor={`application-start-${value}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {label}
                          </Label>
                        </div>
                      ),
                    )}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {applicationStartMonthType === 'custom_month' && (
            <FormField
              control={form.control}
              name="application_custom_month"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="例: 3"
                        className="w-24"
                        value={field.value == null ? '' : String(field.value)}
                        onChange={(event) => {
                          const digitsOnly = event.target.value.replace(/\D/g, '');
                          if (digitsOnly === '') {
                            field.onChange(null);
                            return;
                          }

                          field.onChange(Math.min(Number(digitsOnly), 12));
                        }}
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
            name="application_duration_months"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-1">
                  <CampaignRequiredLabel>適用期間</CampaignRequiredLabel>
                  <p className="text-muted-foreground text-xs">利用開始日起算</p>
                </div>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger className="w-full md:w-60">
                      <SelectValue placeholder="適用期間を選択">
                        {field.value ? `${field.value}ヶ月` : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_APPLICATION_DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
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
