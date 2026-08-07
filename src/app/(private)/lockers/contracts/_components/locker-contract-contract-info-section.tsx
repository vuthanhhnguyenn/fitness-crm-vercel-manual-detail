'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmOptionsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersContractsByIdResponse } from '@/lib/api/types.gen';

import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

type LockerContractContractInfoSectionProps = {
  contract?: LockerContractDetail;
};

export function LockerContractContractInfoSection({
  contract,
}: LockerContractContractInfoSectionProps) {
  const form = useFormContext<LockerContractFormValues>();
  const contractTypeCode = useWatch({ control: form.control, name: 'contract_type_code' });

  const { data: optionsData, isLoading: isLoadingTypes } = useQuery({
    ...getCrmOptionsOptions({
      query: { page: 1, limit: 200, status: 'active', category: 'locker_option' },
    }),
  });

  const contractTypes = useMemo(() => optionsData?.options ?? [], [optionsData?.options]);
  const selectedContractType = useMemo(
    () => contractTypes.find((type) => type.code === contractTypeCode) ?? null,
    [contractTypeCode, contractTypes],
  );

  const endDateLabel = contract?.end_date ? formatDateYYYYMMDD(contract.end_date) : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  契約開始日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="日付を選択"
                    hasError={Boolean(form.formState.errors.start_date)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>契約終了日</FormLabel>
            <Input className="bg-muted h-8" value={endDateLabel} disabled readOnly />
          </FormItem>
        </div>

        <div className="bg-muted/30 mt-4 rounded-lg border px-4 py-4">
          <p className="mb-3 text-xs font-medium">契約種類（G-02）</p>
          <FormField
            control={form.control}
            name="contract_type_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  契約種類<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={isLoadingTypes}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {selectedContractType?.name}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.name}（¥{type.price_including_tax.toLocaleString()}/月）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedContractType ? (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">契約形態コード</p>
                <p className="font-mono text-sm font-medium">{selectedContractType.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">適用料金（月額）</p>
                <p className="text-sm font-medium">
                  ¥{selectedContractType.price_including_tax.toLocaleString()} / 月（税込）
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1 text-xs">適用条件</p>
                <p className="text-sm">{selectedContractType.description ?? ''}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-start gap-2 border-t pt-3">
            <Info className="text-muted-foreground mt-0.5 size-3 shrink-0" />
            <p className="text-muted-foreground text-xs">
              選択した契約種類に基づき、契約形態コードと料金が自動適用されます（G-02
              オプション契約管理）。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
