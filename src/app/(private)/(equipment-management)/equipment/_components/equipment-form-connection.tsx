'use client';

import { useFormContext } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { EquipmentFormValues } from '../_schemas/equipment-form.schema';
import { ControllerPicker } from './controller-picker';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function EquipmentFormConnection() {
  const form = useFormContext<EquipmentFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">接続情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="controller_id"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  接続先接点制御装置
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <ControllerPicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    hasError={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="controller_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  接続先ポート番号
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="接続先ポート番号を入力"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ip_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IPアドレス</FormLabel>
                <FormControl>
                  <Input placeholder="192.168.1.100" maxLength={TEXT_MAX_LENGTH} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mac_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MACアドレス</FormLabel>
                <FormControl>
                  <Input placeholder="XX:XX:XX:XX:XX:XX" maxLength={TEXT_MAX_LENGTH} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
