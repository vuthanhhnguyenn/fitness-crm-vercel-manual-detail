'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { CAMPAIGN_STATUS_LABELS } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';

export function CampaignFormStatus() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <FormLabel>キャンペーンの有効/無効</FormLabel>
                  <p className="text-muted-foreground text-xs">
                    無効化するとこのマスタは編集対象としてのみ保持されます
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {CAMPAIGN_STATUS_LABELS.inactive}
                  </span>
                  <Switch
                    checked={field.value === 'active'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                  />
                  <span className="text-sm font-medium">{CAMPAIGN_STATUS_LABELS.active}</span>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
