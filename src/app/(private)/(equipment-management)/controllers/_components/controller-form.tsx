'use client';

import { useFormContext } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

import { CONTROLLER_FORM_HELPER_TEXTS, CONTROLLER_STATUS_LABELS } from '../_constants/constants';
import {
  CONTROLLER_STATUS_VALUES,
  type ControllerFormValues,
} from '../_schemas/controller-form.schema';
import { ControllerStoreField } from './controller-store-field';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

type ControllerFormProps = {
  mode?: 'create' | 'edit';
  controllerId?: string;
};

export function ControllerForm({ mode = 'create', controllerId }: ControllerFormProps) {
  const form = useFormContext<ControllerFormValues>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
            <FormItem>
              <FormLabel>接点制御装置ID</FormLabel>
              <FormControl>
                <Input
                  className="bg-muted/30"
                  value={mode === 'edit' ? (controllerId ?? '') : '（自動採番）'}
                  disabled
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    装置名
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="装置名を入力" maxLength={TEXT_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_code"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    店舗コード
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <ControllerStoreField
                      value={field.value}
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    設置場所
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 受付室 機器ラック"
                      maxLength={TEXT_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Alert className="mt-4">
            <Info className="size-4" />
            <AlertDescription className="text-xs">
              接続情報は装置本体のラベルまたは管理画面（http://[IP]
              にブラウザでアクセス）で確認できます。不明な場合は本部または導入業者にお問い合わせください。
            </AlertDescription>
          </Alert>

          <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="ip_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    IPアドレス
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.10" className="font-mono" {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    {CONTROLLER_FORM_HELPER_TEXTS.ipAddress}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmware_version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ファームウェアバージョン</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: v2.4.1"
                      className="font-mono"
                      maxLength={TEXT_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    {CONTROLLER_FORM_HELPER_TEXTS.firmwareVersion}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="control_port_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    制御ポート数
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="8"
                      className="font-mono"
                      min={1}
                      max={64}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    {CONTROLLER_FORM_HELPER_TEXTS.controlPortCount}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ポート番号
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="80"
                      className="font-mono"
                      min={1}
                      max={65535}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    {CONTROLLER_FORM_HELPER_TEXTS.port}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">ステータス</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
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
                        <SelectValue>{CONTROLLER_STATUS_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CONTROLLER_STATUS_VALUES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CONTROLLER_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
