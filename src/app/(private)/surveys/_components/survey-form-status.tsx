'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { cn } from '@/lib/utils';

import type { SurveyFormValues } from '../_schemas/survey-form.schema';

export function SurveyFormStatusSection() {
  const form = useFormContext<SurveyFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => {
            const isActive = field.value === 'active';

            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <FormLabel className="text-sm">アンケートの有効/無効</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      無効化するとアンケートが配信されません。回答データは保持されます
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">無効</span>
                    <FormControl>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'inactive')
                        }
                      />
                    </FormControl>
                    <span className={cn('text-sm', isActive && 'font-medium')}>有効</span>
                  </div>
                </div>
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
