'use client';

import { useFormContext } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';

import { StoreListBrand } from '@/lib/api/types.gen';

import { CAMPAIGN_ACCEPT_STATUS_LABELS, CAMPAIGN_BRAND_LABELS } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignRequiredLabel } from './campaign-required-label';

interface CampaignFormBasicInfoProps {
  isEdit?: boolean;
  campaignId?: string;
}

export function CampaignFormBasicInfo({
  isEdit = false,
  campaignId,
}: Readonly<CampaignFormBasicInfoProps>) {
  const form = useFormContext<CampaignFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          {isEdit && campaignId ? (
            <FormItem>
              <FormLabel>キャンペーンID</FormLabel>
              <Input value={campaignId} disabled className="bg-muted/50 font-mono" />
              <p className="text-muted-foreground text-xs">キャンペーンIDは自動採番されます</p>
            </FormItem>
          ) : null}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <CampaignRequiredLabel>キャンペーン名</CampaignRequiredLabel>
                <FormControl>
                  <Input placeholder="例: 春の入会キャンペーン" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-1">
                  <CampaignRequiredLabel>キャンペーンコード</CampaignRequiredLabel>
                  <p className="text-muted-foreground text-xs">
                    命名規則: 「店舗ID＋英数字5桁」（例: STR01A1B2C）/ OGF会員向け:
                    「OGF＋英数字5桁」（例: OGFA1B2C）
                  </p>
                </div>
                <FormControl>
                  <Input placeholder="例: STR01A1B2C" className="font-mono" {...field} />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  登録時にユニーク性を自動チェックします
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <CampaignRequiredLabel>ブランド</CampaignRequiredLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ブランドを選択">
                        {field.value ? CAMPAIGN_BRAND_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[StoreListBrand.JOYFIT, StoreListBrand.FIT365].map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {CAMPAIGN_BRAND_LABELS[brand]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accept_status"
            render={({ field }) => (
              <FormItem>
                <CampaignRequiredLabel>受付可否</CampaignRequiredLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="受付可否を選択">
                        {field.value ? CAMPAIGN_ACCEPT_STATUS_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CAMPAIGN_ACCEPT_STATUS_LABELS).map(([value, label]) => (
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

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  rows={3}
                  placeholder="キャンペーンの目的や概要を入力してください"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
