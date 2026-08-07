'use client';

import { useFormContext } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import type { EquipmentFormValues } from '../_schemas/equipment-form.schema';

export function EquipmentFormRemarks() {
  const form = useFormContext<EquipmentFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">備考</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備考</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="備考を入力（任意）"
                  rows={4}
                  maxLength={TEXTAREA_MAX_LENGTH}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
