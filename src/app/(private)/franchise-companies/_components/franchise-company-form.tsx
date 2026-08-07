'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { format } from 'date-fns';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
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

import { Permission } from '@/types/permission.type';

import {
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_TYPE_FORM_LABELS,
} from '../_constants/constants';
import type {
  FranchiseCompanyFormSubmitValues,
  FranchiseCompanyFormValues,
} from '../_schemas/franchise-company-form.schema';

interface FranchiseCompanyFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: FranchiseCompanyFormSubmitValues) => void;
  onError?: () => void;
  submitPermission?: Permission;
}

export function FranchiseCompanyForm({
  isSubmitting = false,
  onCancel,
  onSubmit,
  onError,
  submitPermission = Permission.FCCompaniesCreate,
}: Readonly<FranchiseCompanyFormProps>) {
  const form = useFormContext<FranchiseCompanyFormValues>();
  const contractStartDate = useWatch({ control: form.control, name: 'fc_contract_start_date' });
  const parsedContractStartDate = contractStartDate ? new Date(contractStartDate) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="formal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    法人名（正式名称）<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 株式会社フィットネスパートナーズ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>法人名（表示名）</FormLabel>
                  <FormControl>
                    <Input placeholder="例: フィットネスパートナーズ" {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">CRM内の一覧等で表示される省略形</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      直営/FC区分<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      key={`franchise-company-type-${field.value ?? 'empty'}`}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="区分を選択">
                            {field.value
                              ? FRANCHISE_COMPANY_TYPE_FORM_LABELS[field.value]
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FRANCHISE_COMPANY_TYPE_FORM_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corporate_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>法人番号</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 1234567890123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direct_owned_flag"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="franchise-company-direct-owned-flag"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                    <Label
                      htmlFor="franchise-company-direct-owned-flag"
                      className="cursor-pointer text-sm font-normal"
                    >
                      直営店フラグ
                    </Label>
                    <span className="text-muted-foreground text-xs">
                      旧システムとの互換性のために保持
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="representative_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代表者名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 山田 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="head_office_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>本社所在地</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 福岡県福岡市中央区天神1-1-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 092-000-0000" {...field} />
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
          <CardTitle className="text-base">担当者情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 佐藤 花子" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者連絡先</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 092-000-0001" {...field} />
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
          <CardTitle className="text-base">契約情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fc_contract_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC契約開始日</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        placeholder="日付を選択"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fc_contract_renewal_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC契約更新日</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        placeholder="日付を選択"
                        disabledDate={(date) =>
                          parsedContractStartDate ? date < parsedContractStartDate : false
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="royalty_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ロイヤリティ率(%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 5"
                      {...field}
                      value={(field.value ?? '') as string | number}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === '' ? undefined : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Phase 2 で計算ロジック提供予定。現時点は参考値のみ
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
          <CardTitle className="text-base">備考</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>備考</FormLabel>
                <FormControl>
                  <Textarea placeholder="補足事項があれば入力してください" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <FormLabel className="text-sm">FC企業の有効/無効</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      新規登録時は有効で作成されます。後で一覧表示対象として利用されます。
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {FRANCHISE_COMPANY_STATUS_LABELS.inactive}
                    </span>
                    <Switch
                      checked={field.value === 'active'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                    />
                    <span className="text-sm font-medium">
                      {FRANCHISE_COMPANY_STATUS_LABELS.active}
                    </span>
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
          requiredPermission={submitPermission}
          disabled={isSubmitting}
          onClick={form.handleSubmit(
            onSubmit as (values: FranchiseCompanyFormValues) => void,
            onError,
          )}
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </RoleGatedButton>
      </div>
    </div>
  );
}
