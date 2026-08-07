'use client';

import { type Control, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmMembershipApplicationsCorporateMastersOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { DirectEnrollmentFormValues } from './enrollment-form';

interface CorporateInfoSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly brand: 'FIT365' | 'JOYFIT' | '';
}

const BILLING_PATTERN_OPTIONS_JOYFIT = [
  { value: 'corporate_full', label: '法人全額' },
  { value: 'split', label: '法人主契約+個人オプション' },
  { value: 'individual_full', label: '個人全額' },
];

export function CorporateInfoSection({ control, brand }: CorporateInfoSectionProps) {
  const { data } = useQuery(getCrmMembershipApplicationsCorporateMastersOptions());
  const corporates = data?.items ?? [];
  const corporateItems = corporates.map((c) => ({ value: c.id, label: c.name }));
  const isFit365 = brand === 'FIT365';
  const corporateId = useWatch({ control: control, name: 'corporate.corporate_id' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>法人情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Corporate select */}
          <FormField
            control={control}
            name="corporate.corporate_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  法人名<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={corporateItems}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {corporates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Auto-populated corporate code */}
          <FormItem>
            <FormLabel>法人コード</FormLabel>
            <FormControl>
              <Input
                readOnly
                value={corporates.find((c) => c.id === corporateId)?.code ?? ''}
                className="bg-muted"
              />
            </FormControl>
          </FormItem>
          {/* Billing pattern */}
          <FormField
            control={control}
            name="corporate.billing_pattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  請求パターン<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                {isFit365 ? (
                  <Input
                    readOnly
                    value="個人全額のみ"
                    className="bg-muted"
                    placeholder="法人宛請求はCRMの管理対象外です（別システムで管理）"
                  />
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    items={BILLING_PATTERN_OPTIONS_JOYFIT}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BILLING_PATTERN_OPTIONS_JOYFIT.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Enrollment fee bearer */}
          <FormField
            control={control}
            name="corporate.enrollment_fee_bearer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  入会金負担<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                {isFit365 ? (
                  <Input
                    readOnly
                    value="FIT365は入会金無料（カード発行料のみ）"
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    items={[
                      { value: 'corporate', label: '企業負担' },
                      { value: 'individual', label: '個人負担' },
                    ]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="corporate">企業負担</SelectItem>
                      <SelectItem value="individual">個人負担</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          法人宛請求はCRMの管理対象外です（別システムで管理）
        </p>
      </CardContent>
    </Card>
  );
}
