'use client';

import { type UseFormReturn, useFormContext, useWatch } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';

import { FormField } from '@/components/common/form-field';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmFranchiseCompaniesOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import type { StaffCreateFormValues } from '../_schemas/staff-create.schema';

function handleAffiliationTypeChange(
  form: UseFormReturn<StaffCreateFormValues>,
  value: 'direct_store' | 'fc_company',
) {
  form.setValue('affiliation_type', value, { shouldDirty: true });
  form.setValue('store_id', '', { shouldDirty: true });
  form.setValue('fc_company_id', '', { shouldDirty: true });
}

export function AffiliationSection() {
  const form = useFormContext<StaffCreateFormValues>();
  const affiliationType = useWatch({ control: form.control, name: 'affiliation_type' });
  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const fcCompanyId = useWatch({ control: form.control, name: 'fc_company_id' });

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' } }),
    enabled: affiliationType === 'direct_store',
  });
  const stores = storesRes?.stores ?? [];

  const { data: fcRes } = useQuery({
    ...getCrmFranchiseCompaniesOptions({ query: { page: 1, limit: 100, company_type: 'fc' } }),
    enabled: affiliationType === 'fc_company',
  });
  const fcCompanies = fcRes?.franchise_companies ?? [];
  const selectedFc = fcCompanies.find((fc) => fc.id === fcCompanyId);
  const selectedFcStores = stores.filter((s) => s.fc_company_id === fcCompanyId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">所属設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            label="所属パターン"
            required
            description="パターンAとパターンBは排他です。どちらか一方のみ選択できます"
          >
            <RadioGroup
              value={affiliationType}
              onValueChange={(value) =>
                handleAffiliationTypeChange(form, value as 'direct_store' | 'fc_company')
              }
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="direct_store" id="aff-store" />
                <Label htmlFor="aff-store" className="cursor-pointer text-sm">
                  パターンA: 店舗直接紐づき（1店舗）
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="fc_company" id="aff-fc" />
                <Label htmlFor="aff-fc" className="cursor-pointer text-sm">
                  パターンB: FC企業紐づき（1社 → 管轄全店舗）
                </Label>
              </div>
            </RadioGroup>
          </FormField>

          {affiliationType === 'direct_store' && (
            <FormField
              label="所属店舗"
              description="1店舗を選択してください"
              error={form.formState.errors.store_id?.message}
            >
              <Select
                value={storeId ?? ''}
                onValueChange={(value) =>
                  form.setValue('store_id', value ?? '', { shouldDirty: true })
                }
                items={toSelectItems(stores.map((s) => ({ value: s.id, label: s.name })))}
              >
                <SelectTrigger className="max-w-[320px]">
                  <SelectValue placeholder="店舗を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {affiliationType === 'fc_company' && (
            <FormField
              label="所属FC企業"
              description="1社を選択してください。管轄全店舗へのアクセスが付与されます"
              error={form.formState.errors.fc_company_id?.message}
            >
              <Select
                value={fcCompanyId ?? ''}
                onValueChange={(value) =>
                  form.setValue('fc_company_id', value ?? '', { shouldDirty: true })
                }
                items={toSelectItems(
                  fcCompanies.map((fc) => ({
                    value: fc.id,
                    label: `${fc.display_name}（管轄${fc.managed_store_count}店舗）`,
                  })),
                )}
              >
                <SelectTrigger className="max-w-[320px]">
                  <SelectValue placeholder="FC企業を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {fcCompanies.map((fc) => (
                    <SelectItem key={fc.id} value={fc.id}>
                      {fc.display_name}（管轄{fc.managed_store_count}店舗）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFc && (
                <div className="bg-muted/30 mt-3 rounded-md border p-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    管轄店舗（このスタッフがアクセスできる店舗）:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFcStores.map((s) => (
                      <Badge key={s.id} variant="outline" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </FormField>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
