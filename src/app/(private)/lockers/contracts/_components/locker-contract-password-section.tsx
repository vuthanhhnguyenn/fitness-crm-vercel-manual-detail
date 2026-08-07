'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Shuffle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { type GetCrmLockersByIdResponse, LockerLockType } from '@/lib/api/types.gen';

import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';

type LockerContractPasswordSectionProps = {
  locker?: NonNullable<GetCrmLockersByIdResponse>['locker'];
};

export function LockerContractPasswordSection({ locker }: LockerContractPasswordSectionProps) {
  const form = useFormContext<LockerContractFormValues>();
  const slotNumber = useWatch({ control: form.control, name: 'slot_number' });

  const selectedSlot = locker?.slot_items.find((slot) => slot.slot_number === slotNumber);
  const lockType = selectedSlot?.lock_type;

  if (lockType === LockerLockType.CYLINDER) {
    return null;
  }

  const generatePassword = () => {
    form.setValue('password', String(Math.floor(1000 + Math.random() * 9000)), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">パスワード管理</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  パスワード<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      className="h-8 font-mono"
                      maxLength={4}
                      placeholder="4桁の数字"
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={generatePassword}
                  >
                    <Shuffle className="size-4" />
                    ランダム生成
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
