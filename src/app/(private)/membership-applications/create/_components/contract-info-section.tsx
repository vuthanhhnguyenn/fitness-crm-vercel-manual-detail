'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { type Control } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

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

import { BRAND_OPTIONS } from '../../_constants/constants';
import type { DirectEnrollmentFormValues } from '../_schemas/enrollment-form.schema';

interface ContractInfoSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly onBrandChange?: () => void;
}

const REAL_BRAND_OPTIONS = BRAND_OPTIONS.filter((b) => b.value !== 'all');

export const PLAN_OPTIONS = [
  { value: 'PLN-001', label: 'レギュラー会員' },
  { value: 'PLN-003', label: 'ナイト会員' },
  { value: 'PLN-002', label: 'デイタイム会員' },
  { value: 'PLN-004', label: 'ウィークエンド会員' },
  { value: 'PLN-005', label: 'レギュラー会員（学生）' },
  { value: 'PLN-006', label: 'レギュラー会員（シニア）' },
];

export const CAMPAIGN_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'CMP-001', label: '春の入会キャンペーン' },
  { value: 'CMP-002', label: '学生割引キャンペーン' },
  { value: 'CMP-004', label: '新生活応援' },
  { value: 'CMP-005', label: 'シニア割引キャンペーン' },
  { value: 'CMP-006', label: '法人会員キャンペーン' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'credit_card', label: 'クレジットカード（SBPS）' },
  { value: 'bank_transfer', label: '口座振替（JACCS）' },
];

export function ContractInfoSection({ control, onBrandChange }: ContractInfoSectionProps) {
  const { data: storesData } = useQuery(getCrmStoresOptions());
  const stores = (storesData?.stores ?? []).map((s) => ({ value: s.id, label: s.name }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>契約情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="contract.brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ブランド<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    onBrandChange?.();
                  }}
                  value={field.value ?? ''}
                  items={toSelectItems(REAL_BRAND_OPTIONS)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REAL_BRAND_OPTIONS.map((item) => (
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
          <FormField
            control={control}
            name="contract.store_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  入会店舗<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={toSelectItems(stores)}
                >
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
                  items={toSelectItems(PLAN_OPTIONS)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLAN_OPTIONS.map((p) => (
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
          <FormField
            control={control}
            name="contract.usage_start_date"
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="contract.campaign_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>適用キャンペーン</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                  value={field.value ?? 'none'}
                  items={toSelectItems(CAMPAIGN_OPTIONS)}
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
                  items={toSelectItems(PAYMENT_METHOD_OPTIONS)}
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
