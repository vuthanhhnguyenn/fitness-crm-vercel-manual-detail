'use client';

import { useFormContext } from 'react-hook-form';

import { AlertTriangle } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { GetCrmMainContractsResponse, GetCrmOptionsResponse } from '@/lib/api/types.gen';
import { OptionDiscountStatus } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  OPTION_DISCOUNT_CONDITION_LABELS,
  OPTION_DISCOUNT_TYPE_LABELS,
} from '../_constants/constants';
import type {
  OptionDiscountFormSubmitValues,
  OptionDiscountFormValues,
} from '../_schemas/option-discount-form.schema';

interface OptionDiscountFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  discountId?: string;
  mainContracts: GetCrmMainContractsResponse['main_contracts'];
  optionMasters: GetCrmOptionsResponse['options'];
  onCancel: () => void;
  onSubmit: (values: OptionDiscountFormSubmitValues) => void;
  onError?: () => void;
}

export function OptionDiscountForm({
  isEdit = false,
  isSubmitting = false,
  mainContracts,
  optionMasters,
  onCancel,
  onSubmit,
  onError,
}: Readonly<OptionDiscountFormProps>) {
  const form = useFormContext<OptionDiscountFormValues>();

  return (
    <div className="flex flex-col gap-6">
      {isEdit && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="text-warning size-4" />
          <AlertDescription className="text-muted-foreground text-xs">
            割引条件を変更すると、現在この割引が適用中の会員にも反映されます。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    セット割名<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: レギュラー＋水素水セット" {...field} />
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
                  <FormLabel>
                    コード<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: SET-001" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="セット割の説明を入力してください"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">対象商品</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="target_contract_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    対象契約<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
                      {mainContracts.length === 0 && (
                        <p className="text-muted-foreground col-span-full text-xs">
                          契約データを読み込み中...
                        </p>
                      )}
                      {mainContracts.map((contract) => {
                        const checked = field.value.includes(contract.id);
                        return (
                          <div key={contract.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`target-contract-${contract.id}`}
                              checked={checked}
                              onCheckedChange={(value) => {
                                if (value) {
                                  field.onChange([...field.value, contract.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((item) => item !== contract.id),
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`target-contract-${contract.id}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {contract.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_option_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    対象オプション<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
                      {optionMasters.length === 0 && (
                        <p className="text-muted-foreground col-span-full text-xs">
                          オプションデータを読み込み中...
                        </p>
                      )}
                      {optionMasters.map((option) => {
                        const checked = field.value.includes(option.id);
                        return (
                          <div key={option.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`target-option-${option.id}`}
                              checked={checked}
                              onCheckedChange={(value) => {
                                if (value) {
                                  field.onChange([...field.value, option.id]);
                                } else {
                                  field.onChange(field.value.filter((item) => item !== option.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`target-option-${option.id}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {option.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">割引設定</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="discount_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    割引タイプ<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    key={`discount-type-${field.value ?? 'empty'}`}
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="割引タイプを選択">
                          {field.value ? OPTION_DISCOUNT_TYPE_LABELS[field.value] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(OPTION_DISCOUNT_TYPE_LABELS).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
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
              name="discount_value"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    割引金額/率<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例: 330（円）または 10（%）"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          field.value === undefined || field.value === null
                            ? ''
                            : String(field.value)
                        }
                        aria-invalid={fieldState.invalid}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    適用条件<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    key={`conditions-${field.value ?? 'empty'}`}
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="適用条件を選択">
                          {field.value ? OPTION_DISCOUNT_CONDITION_LABELS[field.value] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(OPTION_DISCOUNT_CONDITION_LABELS).map(([value, label]) => (
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <FormLabel className="text-sm">セット割の有効/無効</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      無効にすると新規入会フローでの選択肢から外れます
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">無効</span>
                    <Switch
                      checked={field.value === OptionDiscountStatus.ACTIVE}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked ? OptionDiscountStatus.ACTIVE : OptionDiscountStatus.INACTIVE,
                        );
                      }}
                    />
                    <span className="text-sm font-medium">有効</span>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 border-t p-4">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <RoleGatedButton
          type="button"
          size="lg"
          requiredPermission={
            isEdit ? Permission.OptionDiscountsEdit : Permission.OptionDiscountsCreate
          }
          disabled={isSubmitting}
          onClick={form.handleSubmit(
            onSubmit as (values: OptionDiscountFormValues) => void,
            onError,
          )}
        >
          {isSubmitting ? (isEdit ? '更新中...' : '登録中...') : isEdit ? '更新する' : '登録する'}
        </RoleGatedButton>
      </div>
    </div>
  );
}
