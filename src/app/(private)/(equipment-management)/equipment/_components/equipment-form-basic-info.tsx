'use client';

import { useFormContext } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
  EQUIPMENT_AUTHENTICATION_LABELS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '../_constants/constants';
import {
  EQUIPMENT_AUTH_VALUES,
  EQUIPMENT_STATUS_VALUES,
  EQUIPMENT_TYPE_VALUES,
  type EquipmentFormValues,
} from '../_schemas/equipment-form.schema';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function EquipmentFormBasicInfo({ equipmentId }: { equipmentId?: string }) {
  const form = useFormContext<EquipmentFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <FormItem>
            <FormLabel>接続機器ID</FormLabel>
            <FormControl>
              <Input className="bg-muted/30" value={equipmentId ?? '（自動採番）'} disabled />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  機器名
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input placeholder="機器名を入力" maxLength={TEXT_MAX_LENGTH} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="equipment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  機器タイプ
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選択してください">
                        {field.value ? EQUIPMENT_TYPE_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPE_VALUES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {EQUIPMENT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  シリアルナンバー
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="シリアルナンバーを入力"
                    maxLength={TEXT_MAX_LENGTH}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="install_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  設置場所
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input placeholder="例: 1F入口" maxLength={TEXT_MAX_LENGTH} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installed_on"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  設置日
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="設置日を選択"
                    hasError={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  状態
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{EQUIPMENT_STATUS_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {EQUIPMENT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authentication_method"
            render={({ field, fieldState }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  認証方式
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    className="flex flex-wrap items-center gap-6 pt-1"
                  >
                    {EQUIPMENT_AUTH_VALUES.map((method) => (
                      <div key={method} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={method}
                          id={`auth-${method}`}
                          className={
                            fieldState.error ? 'border-destructive text-destructive' : undefined
                          }
                        />
                        <Label
                          htmlFor={`auth-${method}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {EQUIPMENT_AUTHENTICATION_LABELS[method]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
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
