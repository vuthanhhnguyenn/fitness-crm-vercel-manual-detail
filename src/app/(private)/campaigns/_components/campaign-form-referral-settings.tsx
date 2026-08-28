'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';

type ToggleRowProps = {
  name: 'referralTieredIncrease' | 'referralAnnualReset';
  id: string;
  label: string;
  description: string;
};

function ToggleRow({ name, id, label, description }: Readonly<ToggleRowProps>) {
  const form = useFormContext<CampaignFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor={id} className="text-sm">
                {label}
              </Label>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <FormControl>
              <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CampaignFormReferralSettings() {
  const form = useFormContext<CampaignFormValues>();
  const referralEnabled = useWatch({ control: form.control, name: 'referralEnabled' });
  const tieredIncrease = useWatch({ control: form.control, name: 'referralTieredIncrease' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">紹介キャンペーン設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="referralEnabled"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="referral-switch" className="text-sm">
                      紹介キャンペーンとして設定する
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      アプリの友達招待機能と連動する紹介キャンペーンとして設定します
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      id="referral-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {referralEnabled && (
            <>
              <Separator />

              <FormField
                control={form.control}
                name="referralPoints"
                render={({ field }) => (
                  <FormItem>
                    <CampaignFieldLabel required>紹介者への特典ポイント</CampaignFieldLabel>
                    <FormDescription>紹介成立1件ごとに紹介者へ付与するポイント</FormDescription>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="例: 500"
                          className="w-28"
                          {...field}
                        />
                      </FormControl>
                      <span className="text-muted-foreground text-sm">ポイント</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ToggleRow
                name="referralTieredIncrease"
                id="referral-tiered"
                label="段階的増加"
                description="紹介人数に応じて付与ポイントを段階的に増やします"
              />

              {tieredIncrease && (
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="referralTierThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <CampaignFieldLabel required>段階的増加の開始人数</CampaignFieldLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="例: 3"
                              className="w-28"
                              {...field}
                            />
                          </FormControl>
                          <span className="text-muted-foreground text-sm">人目以降</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referralTierPoints"
                    render={({ field }) => (
                      <FormItem>
                        <CampaignFieldLabel required>増加後のポイント</CampaignFieldLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="例: 2000"
                              className="w-28"
                              {...field}
                            />
                          </FormControl>
                          <span className="text-muted-foreground text-sm">ポイント</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <ToggleRow
                name="referralAnnualReset"
                id="referral-reset"
                label="ポイント年次リセット"
                description="紹介者特典ポイントを毎年3/31にリセットします"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
