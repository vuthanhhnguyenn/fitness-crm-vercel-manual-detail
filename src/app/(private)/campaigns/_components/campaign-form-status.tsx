'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';

export function CampaignFormStatus() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">受付可否</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          control={form.control}
          name="isAccepting"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="accept-flag" className="text-sm">
                    キャンペーンの受付可否
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    OFF（停止）にすると入会フローからこのキャンペーンが非表示になります。先着件数上限に到達した場合は、システムが自動で受付可否フラグをOFFにします。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">停止</span>
                  <FormControl>
                    <Switch
                      id="accept-flag"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm font-medium">受付中</span>
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
