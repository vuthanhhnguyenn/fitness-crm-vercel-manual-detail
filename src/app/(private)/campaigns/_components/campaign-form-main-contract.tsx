'use client';

import { useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmMainContractsOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignRequiredLabel } from './campaign-required-label';

export function CampaignFormMainContract() {
  const form = useFormContext<CampaignFormValues>();
  const { data: mainContractsData } = useQuery({
    ...getCrmMainContractsOptions({ query: { limit: 200 } }),
  });
  const mainContractOptions = mainContractsData?.main_contracts ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">適用主契約</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          control={form.control}
          name="main_contract_id"
          render={({ field }) => (
            <FormItem>
              <CampaignRequiredLabel>適用主契約</CampaignRequiredLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="主契約を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mainContractOptions.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                キャンペーン選択時にこの主契約が自動で決定されます
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
