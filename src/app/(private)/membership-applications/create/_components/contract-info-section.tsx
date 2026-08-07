'use client';

import { type Control, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { DirectEnrollmentFormValues } from './enrollment-form';

interface ContractInfoSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly onBrandChange?: (brand: 'FIT365' | 'JOYFIT' | '') => void;
}

const PLAN_OPTIONS: Record<'FIT365' | 'JOYFIT', { value: string; label: string }[]> = {
  FIT365: [
    { value: 'FIT365-REGULAR', label: 'レギュラー会員' },
    { value: 'FIT365-DAYTIME', label: 'デイタイム会員' },
    { value: 'FIT365-NIGHT', label: 'ナイト会員' },
    { value: 'FIT365-WEEKEND', label: 'ウィークエンド会員' },
    { value: 'FIT365-STUDENT', label: 'レギュラー会員（学生）' },
    { value: 'FIT365-SENIOR', label: 'レギュラー会員（シニア）' },
  ],
  JOYFIT: [
    { value: 'JOYFIT-REGULAR', label: 'レギュラー会員' },
    { value: 'JOYFIT-NIGHT', label: 'ナイト会員' },
    { value: 'JOYFIT-DAYTIME', label: 'デイタイム会員' },
    { value: 'JOYFIT-WEEKEND', label: 'ウィークエンド会員' },
    { value: 'JOYFIT-STUDENT', label: 'レギュラー会員（学生）' },
    { value: 'JOYFIT-SENIOR', label: 'レギュラー会員（シニア）' },
  ],
};

const BRAND_OPTIONS = [
  { value: 'FIT365', label: 'FIT365' },
  { value: 'JOYFIT', label: 'JOYFIT' },
];

const CAMPAIGN_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'SPRING2026', label: '春の入会キャンペーン' },
  { value: 'STUDENT', label: '学生割引キャンペーン' },
  { value: 'NEW_LIFE', label: '新生活応援' },
  { value: 'SENIOR', label: 'シニア割引キャンペーン' },
  { value: 'CORPORATE', label: '法人会員キャンペーン' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'credit_card', label: 'クレジットカード（SBPS）' },
  { value: 'bank_transfer', label: '口座振替（JACCS）' },
];

export function ContractInfoSection({ control, onBrandChange }: ContractInfoSectionProps) {
  const { data: storesData } = useQuery(getCrmStoresOptions());
  const stores =
    storesData?.stores?.map((s) => ({
      value: s.id,
      label: s.name,
    })) ?? [];
  const brand = useWatch({ control: control, name: 'contract.brand' });
  return (
    <Card>
      <CardHeader>
        <CardTitle>契約情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Brand */}
          <FormField
            control={control}
            name="contract.brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ブランド<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    onBrandChange?.(v as 'FIT365' | 'JOYFIT');
                  }}
                  value={field.value ?? ''}
                  items={BRAND_OPTIONS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAND_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Store */}
          <FormField
            control={control}
            name="contract.store_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  入会店舗<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} items={stores}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Plan */}
          <FormField
            control={control}
            name="contract.plan_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  プラン<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={PLAN_OPTIONS[brand ?? 'FIT365'] ?? []}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(PLAN_OPTIONS[brand ?? 'FIT365'] ?? []).map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Start date */}
          <FormField
            control={control}
            name="contract.start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  利用開始日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    placeholder="日付を選択"
                    onDateChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    disabledDate={{ after: addMonths(new Date(), 2) }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Campaign */}
          <FormField
            control={control}
            name="contract.campaign_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>適用キャンペーン</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'none'}
                  items={CAMPAIGN_OPTIONS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="なし" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Payment method */}
          <FormField
            control={control}
            name="contract.payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  決済方法<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={PAYMENT_METHOD_OPTIONS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
