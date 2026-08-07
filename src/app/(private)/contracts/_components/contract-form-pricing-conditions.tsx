'use client';

import { useFormContext } from 'react-hook-form';

import { format } from 'date-fns';

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

import { MainContractStatus } from '@/lib/api/types.gen';

import { type ContractFormValues, DAYS_OF_WEEK } from '../_schemas/contract-form.schema';

export function ContractFormPricingConditions() {
  const form = useFormContext<ContractFormValues>();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">料金</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 items-start gap-6 px-4">
          <FormField
            control={form.control}
            name="price_including_tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  料金（税込）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="7700"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="suspension_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>休会時請求金額（税込）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1100"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  税率<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`tax_rate-${field.value ?? 'empty'}`}
                  value={field.value != null ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="税率を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="8">8%（軽減税率）</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accounting_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  会計コード<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: ACC-101"
                    className="font-mono"
                    {...field}
                    value={(field.value ?? '') as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enrollment_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>入会金（税別）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 2000"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">JOYFIT: 2,000円</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="handling_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>事務手数料（税別）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 3000"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">JOYFIT: 3,000円</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="card_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カード発行料（税別）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 5000"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">FIT365: 5,000円</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="security_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>セキュリティ管理費</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 0"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">FIT365 一部主契約のみ</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maintenance_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>施設メンテナンス料</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 0"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">FIT365 一部主契約のみ</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">利用条件</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-6 px-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  利用開始日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                    placeholder="日付を選択"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monthly_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>月額会員回数上限</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="制限なしの場合は空欄"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="suspension_monthly_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>休会中月利用回数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="制限なしの場合は空欄"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">利用可能時間（曜日別）</Label>
              <div className="mt-1 grid grid-cols-1 gap-2">
                {DAYS_OF_WEEK.map((day, index) => {
                  const fromField = form.register(`usage_hours_by_day.${index}.from`);
                  const toField = form.register(`usage_hours_by_day.${index}.to`);
                  const allDayValue = form.watch(`usage_hours_by_day.${index}.all_day`);

                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-sm">{day}</span>
                      <Input
                        type="time"
                        className="h-8 w-28 text-xs"
                        disabled={allDayValue}
                        {...fromField}
                      />
                      <span className="text-muted-foreground text-xs">〜</span>
                      <Input
                        type="time"
                        className="h-8 w-28 text-xs"
                        disabled={allDayValue}
                        {...toField}
                      />
                      <div className="ml-2 flex items-center gap-2">
                        <Checkbox
                          id={`allday-${day}`}
                          checked={allDayValue}
                          onCheckedChange={(checked) =>
                            form.setValue(`usage_hours_by_day.${index}.all_day`, Boolean(checked))
                          }
                        />
                        <Label htmlFor={`allday-${day}`} className="text-xs font-normal">
                          終日
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">休会・退会</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 px-4">
          <FormField
            control={form.control}
            name="suspendable_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>休会可能月</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 1〜3月"
                    {...field}
                    value={(field.value ?? '') as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cancellable_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>退会可能月</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 毎月"
                    {...field}
                    value={(field.value ?? '') as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="initial_payment_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>初回支払月数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="例: 1"
                    {...field}
                    value={(field.value ?? '') as string | number}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">対象制限</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 px-4">
          <FormField
            control={form.control}
            name="age_restriction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>年齢制限</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 16歳以上"
                    {...field}
                    value={(field.value ?? '') as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender_restriction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>性別制限</FormLabel>
                <Select
                  key={`gender-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="制限を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="制限なし">制限なし</SelectItem>
                    <SelectItem value="男性のみ">男性のみ</SelectItem>
                    <SelectItem value="女性のみ">女性のみ</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="changeability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>主契約変更可否</FormLabel>
                <Select
                  key={`changeability-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="可">可</SelectItem>
                    <SelectItem value="不可">不可</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_enabled"
            render={({ field }) => (
              <FormItem>
                <FormLabel>課金有無</FormLabel>
                <Select
                  key={`billing-${String(field.value ?? 'empty')}`}
                  value={field.value !== undefined ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(v === 'true')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください">
                        {field.value !== undefined
                          ? field.value === true
                            ? 'あり'
                            : 'なし'
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">あり</SelectItem>
                    <SelectItem value="false">なし</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modifiable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>変更可否</FormLabel>
                <Select
                  key={`modifiable-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="可">可</SelectItem>
                    <SelectItem value="不可">不可</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="same_day_cancellation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">退会申請当月の退会可</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="family_contract_allowed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">家族会員契約可</FormLabel>
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
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <FormLabel className="text-sm">主契約の有効/無効</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      有効にすると、新規の契約申請でこのプランが選択できるようになります
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">無効</span>
                    <Switch
                      checked={field.value === MainContractStatus.ACTIVE}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked ? MainContractStatus.ACTIVE : MainContractStatus.INACTIVE,
                        )
                      }
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
    </div>
  );
}
